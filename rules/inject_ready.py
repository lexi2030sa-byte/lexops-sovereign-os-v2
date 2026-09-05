import json, re, os
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
db = firestore.client()

def normalize_rule(rule, source_group, category, doc_type):
    rule_id = rule.get('id') or rule.get('rule_id') or rule.get('violation_id') or rule.get('rule_id') or 'unknown'
    return {
        'id': rule_id,
        'source_group': source_group,
        'category': category,
        'doc_type': doc_type,
        'data': rule,
        'created_at': datetime.utcnow().isoformat() + 'Z',
        'updated_at': datetime.utcnow().isoformat() + 'Z'
    }

def inject_batch(rules, collection_name):
    batch = db.batch()
    count = 0
    for rule in rules:
        doc_ref = db.collection(collection_name).document(rule['id'])
        batch.set(doc_ref, rule)
        count += 1
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()
    if count % 400 != 0:
        batch.commit()
    print(f'✅ {count} عنصر في {collection_name}')
    return count

# استخراج JSON من ملفات متعددة (في كتل ```json أو مباشرة)
def extract_json_from_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    objects = []
    # كتل ```json
    blocks = re.findall(r'```json\s*\n(.*?)```', content, re.DOTALL)
    for block in blocks:
        try:
            objects.append(json.loads(block))
        except:
            pass
    if not objects:
        # محاولة raw_decode
        match = re.search(r'[\[{]', content)
        if match:
            start = match.start()
            try:
                decoder = json.JSONDecoder()
                obj, _ = decoder.raw_decode(content[start:])
                objects.append(obj)
            except:
                pass
    return objects

total = 0
# 1) logic_rules
for obj in extract_json_from_file('logic_rules.json'):
    rules = obj.get('rules', [])
    inj = [normalize_rule(r, 'logic', r.get('category','LOGIC'), 'logic') for r in rules]
    total += inject_batch(inj, 'logic_rules')

# 2) municipal
for obj in extract_json_from_file('municipal.json'):
    # بنية: document.compliance_rules قد تكون قائمة
    doc = obj.get('document', {})
    rules = doc.get('compliance_rules', [])
    if not rules:
        # قد تكون داخل chapters
        for ch in doc.get('chapters', []):
            for art in ch.get('articles', []):
                rules.extend(art.get('definitions', []))
                rules.extend(art.get('penalties', []))
                rules.extend(art.get('content', []))
    inj = [normalize_rule(r, 'municipal', 'MUNICIPAL', 'municipal') for r in rules]
    total += inject_batch(inj, 'compliance_rules')

# 3) nitaqat
for obj in extract_json_from_file('nitaqat.json'):
    rules = obj.get('operational_rules', [])
    inj = [normalize_rule(r, 'nitaqat', 'NITAQAT', 'ratio') for r in rules]
    total += inject_batch(inj, 'operational_rules')

# 4) socf
for obj in extract_json_from_file('socf.json'):
    modules = obj.get('SOCF', {}).get('modules', {})
    for mod_name, rules_list in modules.items():
        inj = [normalize_rule(r, 'socf', mod_name, 'socf') for r in rules_list]
        total += inject_batch(inj, 'socf_rules')

# 5) socf_penalties
for obj in extract_json_from_file('socf_penalties.json'):
    table = obj.get('gosi_penalties_table', {})
    violations = table.get('violations', [])
    inj = [normalize_rule(v, 'socf_penalties', 'PENALTIES', 'penalty') for v in violations]
    total += inject_batch(inj, 'compliance_rules')

print(f'🎉 إجمالي ما تم حقنه الآن: {total}')
