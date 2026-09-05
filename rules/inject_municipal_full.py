import json, re, time
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
db = firestore.client()

def safe_id(rule):
    """توليد معرف آمن من الحقول المتاحة"""
    if isinstance(rule, dict):
        for key in ['id', 'rule_id', 'code', 'violation_id', 'article_id', 'term']:
            val = rule.get(key)
            if val and isinstance(val, str) and val.strip():
                return val.strip().replace('/', '-').replace(' ', '_')
    return f"unknown_{int(time.time()*1000)}"

def normalize_rule(rule, source_group, category, doc_type):
    rid = safe_id(rule)
    return {
        'id': rid,
        'source_group': source_group,
        'category': category,
        'doc_type': doc_type,
        'data': rule,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }

def inject_rules(rules, doc_type):
    batch = db.batch()
    count = 0
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        nr = normalize_rule(rule, 'municipal', 'MUNICIPAL', doc_type)
        # تجاهل المعرفات الفارغة فقط
        if nr['id'] == '':
            continue
        db.collection('compliance_rules').document(nr['id']).set(nr)
        count += 1
    return count

# قراءة الملف واستخراج الكائنات
with open('municipal.json','r',encoding='utf-8') as f:
    content=f.read()

decoder = json.JSONDecoder()
objects = []
pos = 0
while pos < len(content):
    match = re.search(r'[\[{]', content[pos:])
    if not match:
        break
    start = pos + match.start()
    try:
        obj, end = decoder.raw_decode(content[start:])
        objects.append(obj)
        pos = start + end
    except:
        pos += 1

total = 0

for obj in objects:
    if not isinstance(obj, dict):
        continue
    # 1) document مع compliance_rules
    if 'document' in obj:
        doc = obj['document']
        cr = doc.get('compliance_rules', [])
        if cr:
            total += inject_rules(cr, 'municipal_doc')
        # فصول
        for chapter in doc.get('chapters', []):
            for article in chapter.get('articles', []):
                if 'rules' in article:
                    total += inject_rules(article['rules'], 'municipal_rules')
                if 'violations' in article:
                    total += inject_rules(article['violations'], 'municipal_violation')
    # 2) كائنات جداول المخالفات (code, description...)
    if 'code' in obj and 'description' in obj:
        total += inject_rules([obj], 'municipal_table')
    # 3) قوائم violations مباشرة
    if 'violations' in obj and isinstance(obj['violations'], list):
        total += inject_rules(obj['violations'], 'municipal_violation')
    # 4) sub_categories تحتوي violations
    if 'sub_categories' in obj and isinstance(obj['sub_categories'], list):
        for sc in obj['sub_categories']:
            if isinstance(sc, dict) and 'violations' in sc:
                total += inject_rules(sc['violations'], 'municipal_subcat')

print(f"✅ إجمالي القواعد البلدية المستخرجة والمحقونة: {total}")
