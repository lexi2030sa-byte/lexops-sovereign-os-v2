import json, os, re
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
db = firestore.client()

def normalize_rule(rule, source_group, category, doc_type):
    rule_id = rule.get('id') or rule.get('rule_id') or rule.get('violation_id') or 'unknown'
    return {
        'id': rule_id,
        'source_group': source_group,
        'category': category,
        'doc_type': doc_type,
        'data': rule,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }

def is_rule(obj):
    """التحقق من أن الكائن يمثل قاعدة (يحتوي rule_id أو id)"""
    return isinstance(obj, dict) and ('rule_id' in obj or 'id' in obj or 'violation_id' in obj)

def extract_rules_from_obj(obj, source_group, category, doc_type, rules_list):
    """استخراج القواعد من أي بنية JSON معروفة"""
    # 1) كائن قاعدة مباشرة
    if is_rule(obj):
        rules_list.append(normalize_rule(obj, source_group, category, doc_type))
        return
    # 2) قائمة من القواعد
    if isinstance(obj, list):
        for item in obj:
            extract_rules_from_obj(item, source_group, category, doc_type, rules_list)
        return
    # 3) مقال
    if 'article_number' in obj and 'compliance_rules' in obj:
        for rule in obj['compliance_rules']:
            extract_rules_from_obj(rule, source_group, 'COMPLIANCE', 'article', rules_list)
    # 4) قسم بمقالات
    if 'section_number' in obj and 'articles' in obj:
        for article in obj['articles']:
            extract_rules_from_obj(article, source_group, category, doc_type, rules_list)
    # 5) قسم بجداول
    if 'section_number' in obj and 'tables' in obj:
        for table in obj['tables']:
            if 'rows' in table:
                for row in table['rows']:
                    extract_rules_from_obj(row, source_group, 'VIOLATION_TABLE', 'table', rules_list)
    # 6) ملف كامل sections
    if 'file_name' in obj and 'sections' in obj:
        for section in obj['sections']:
            extract_rules_from_obj(section, source_group, category, doc_type, rules_list)
    # 7) أي مفاتيح تحتوي قوائم قواعد شائعة
    for key in ['compliance_rules', 'operational_rules', 'rules', 'violations']:
        if key in obj and isinstance(obj[key], list):
            for rule in obj[key]:
                extract_rules_from_obj(rule, source_group, category, doc_type, rules_list)

# جمع القواعد من جميع ملفات labor_law_part_*
all_rules = []
files_processed = 0
for part_file in sorted(os.listdir('.')):
    if not part_file.startswith('labor_law_part_') or not part_file.endswith('.json'):
        continue
    files_processed += 1
    with open(part_file, 'r', encoding='utf-8') as f:
        obj = json.load(f)
    extract_rules_from_obj(obj, 'labor_law', 'COMPLIANCE', 'article', all_rules)

print(f"📄 عدد الملفات المعالجة: {files_processed}")
print(f"📊 عدد القواعد الأولية المستخرجة: {len(all_rules)}")

# إزالة التكرار بناءً على rule_id
seen = set()
unique_rules = []
for rule in all_rules:
    if rule['id'] in seen:
        continue
    seen.add(rule['id'])
    unique_rules.append(rule)

print(f"✅ عدد القواعد الفريدة: {len(unique_rules)}")

# حقن في Firestore
batch = db.batch()
count = 0
for rule in unique_rules:
    doc_ref = db.collection('compliance_rules').document(rule['id'])
    batch.set(doc_ref, rule)
    count += 1
    if count % 400 == 0:
        batch.commit()
        batch = db.batch()
if count % 400 != 0:
    batch.commit()

print(f'🎉 تم حقن {count} قاعدة من نظام العمل في compliance_rules')
