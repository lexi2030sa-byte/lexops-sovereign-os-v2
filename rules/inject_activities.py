import json, re
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
db = firestore.client()

with open('activities.json', 'r', encoding='utf-8') as f:
    content = f.read()

# استخراج كتل المفاتيح والقيم باستخدام regex
pattern = r'"(\d+)"\s*:\s*(\{.*?\})\s*(?=,\s*"\d+"\s*:|\s*$)'
matches = re.finditer(pattern, content, re.DOTALL)

seen_keys = set()
rules = []
for match in matches:
    key = match.group(1)
    json_str = match.group(2)
    if key in seen_keys:
        continue  # تجاهل المفتاح المكرر
    seen_keys.add(key)
    try:
        value = json.loads(json_str)
    except Exception as e:
        print(f"⚠️ فشل تحليل المفتاح {key}: {e}")
        continue
    rules.append({
        'id': f"ACT-{key}",
        'source_group': 'activities',
        'category': 'ACTIVITY',
        'doc_type': 'activity',
        'data': value,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    })

print(f"عدد الأنشطة المستخرجة: {len(rules)}")

# حقن في Firestore
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
print(f"✅ تم حقن {count} نشاط في operational_rules")
