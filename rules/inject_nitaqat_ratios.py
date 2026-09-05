import json, re
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
db = firestore.client()

with open('nitaqat.json', 'r', encoding='utf-8') as f:
    content = f.read()

# التقاط كل كائن JSON يحتوي على rule_id يبدأ بـ NISAB
pattern = r'\{[^{}]*"rule_id"\s*:\s*"NISAB-\d+"[^{}]*\}'
matches = re.findall(pattern, content, re.DOTALL)

rules = []
seen = set()
for m in matches:
    try:
        obj = json.loads(m)
    except Exception:
        # محاولة إصلاح الفواصل الناقصة بإضافة } يدوية
        try:
            obj = json.loads(m + '}')
        except:
            continue
    rid = obj.get('rule_id')
    if rid in seen:
        continue
    seen.add(rid)
    rules.append({
        'id': rid,
        'source_group': 'nitaqat_ratios',
        'category': 'NITAQAT_RATIO',
        'doc_type': 'ratio',
        'data': obj,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    })

print(f"عدد نسب نطاقات المستخرجة: {len(rules)}")

batch = db.batch()
count = 0
for rule in rules:
    db.collection('operational_rules').document(rule['id']).set(rule)
    count += 1
    if count % 400 == 0:
        batch.commit()
        batch = db.batch()
if count % 400 != 0:
    batch.commit()
print(f"✅ تم حقن {count} نسبة في operational_rules")
