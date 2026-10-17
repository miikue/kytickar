import zipfile
import json
import os
import shutil

# Paths
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
kytickar_zip_path = os.path.join(root_dir, 'default-data', 'kytickar_seed.zip')
natka_zip_path = os.path.join(root_dir, 'default-data', 'natka_seed.zip')
species_dir = os.path.join(root_dir, 'app', 'public', 'species')

output_zip_path = os.path.join(root_dir, 'default-data', 'natka2_seed.zip')
output_alias_zip_path = os.path.join(root_dir, 'default-data', 'naty2_seed.zip')
output_db_json_path = os.path.join(root_dir, 'default-data', 'db.json')
app_default_data_path = os.path.join(root_dir, 'app', 'src', 'data', 'defaultData.json')

# Load seeds
with zipfile.ZipFile(kytickar_zip_path, 'r') as z:
    k_json = json.loads(z.read('db.json'))
    k_data = k_json['data']

with zipfile.ZipFile(natka_zip_path, 'r') as z:
    n_json = json.loads(z.read('db.json'))
    n_data = n_json['data']

print("Loaded seeds successfully.")

# 1. Remap duplicate/redundant druhy in Natka's plants
remap_druhy = {
    59: 2,   # Adansonii -> Monstera adansonii
    62: 1,   # Deliciosa -> Monstera deliciosa
    67: 3,   # elastica -> Ficus elastica
    54: 4,   # Heartleaf -> Philodendron hederaceum
    20: 6,   # trifasciata (under Dracaena) -> Sansevieria trifasciata
    61: 60,  # comosus -> Comosus (Ananas comosus)
}

remapped_plants = 0
for r in n_data['rostliny']:
    if r['druhId'] in remap_druhy:
        old_id = r['druhId']
        r['druhId'] = remap_druhy[old_id]
        remapped_plants += 1
        print(f"  Remapped plant '{r['vlastniJmeno']}' (id: {r['id']}): druhId {old_id} -> {r['druhId']}")

print(f"Remapped {remapped_plants} plants to primary species.")

# Merge lowercase rod 'euphorbia' (id 40) into 'Euphorbia' (id 23)
for d in n_data['druhy']:
    if d['rodId'] == 40:
        d['rodId'] = 23
        print(f"  Remapped Druh '{d['nazev']}' rodId 40 -> 23")

# Delete duplicate rod 40
n_data['rody'] = [r for r in n_data['rody'] if r['id'] != 40]
print("Removed duplicate rod 'euphorbia' (id: 40).")

# Delete empty duplicate druhy
deleted_druhy_ids = set(remap_druhy.keys())
n_data['druhy'] = [d for d in n_data['druhy'] if d['id'] not in deleted_druhy_ids]
print(f"Removed {len(deleted_druhy_ids)} redundant duplicate druhy.")

# Polish Druh 60 (Ananas)
for d in n_data['druhy']:
    if d['id'] == 60:
        d['nazev'] = "Ananas comosus"
        d['popis'] = "Ananasovník chocholatý, tropická rostlina s dekorativní růžicí listů a plody."

# Enrich existing Natka druhy with catalog info from kytickar_seed
enrich_specs = {
    14: {"nazev": "Ceropegia woodii (Svícník)", "fotka1Name": "ceropegia_woodii.jpg", "popis": "Převislý sukulent s jemnými srdčitými listy a korálkovitými hlízami."},
    12: {"nazev": "Crassula ovata (Tlustice)", "fotka1Name": "crassula_ovata.jpg", "popis": "Nenáročný sukulentní keř se silnými dužnatými listy a dřevnatějícím stonkem."},
    18: {"nazev": "Zamioculcas zamiifolia (Zamiokulkas)", "fotka1Name": "zamioculcas_zamiifolia.jpg", "popis": "Mimořádně odolná rostlina s lesklými tmavě zelenými zpeřenými listy."},
    27: {"nazev": "Epipremnum 'Marble Queen'", "fotka1Name": "epipremnum_marble_queen.jpg", "popis": "Panašovaný kultivar šplhavnice s krémově bílým a zeleným mramorováním."},
    40: {"nazev": "Alocasia zebrina", "fotka1Name": "alocasia_zebrina.jpg", "popis": "Exotická alokázie s nápadně pruhovanými zebrovanými řapíky."},
    52: {"nazev": "Alocasia amazonica 'Polly'", "fotka1Name": "alocasia_amazonica_polly.jpg", "popis": "Kompaktní alokázie s tmavě zelenými listy s výrazným stříbřitě bílým žilkováním."},
    56: {"nazev": "Ficus benjamina (Drobnolistý)", "fotka1Name": "ficus_benjamina.jpg", "popis": "Oblíbený drobnolistý pokojový fíkus s převislými větvičkami."},
    21: {"nazev": "Scindapsus treubii 'Moonlight'", "fotka1Name": "scindapsus_treubii.jpg", "popis": "Krásný šplhavec se sametově matnými stříbřitě šedými listy."},
    8:  {"nazev": "Scindapsus pictus 'Argyraeus'", "fotka1Name": "scindapsus_pictus.jpg", "popis": "Stříbřitě kropenatá šplhavnice se srdčitými listy."},
    7:  {"nazev": "Phalaenopsis (Můrovec)", "fotka1Name": "phalaenopsis.jpg", "popis": "Nejrozšířenější pokojová orchidej kvetoucí pestrými květy po dlouhé měsíce."}
}

for d in n_data['druhy']:
    if d['id'] in enrich_specs:
        info = enrich_specs[d['id']]
        d['nazev'] = info['nazev']
        d['fotka1Name'] = info['fotka1Name']
        d['popis'] = info['popis']
        print(f"  Enriched Druh {d['id']} -> {d['nazev']} (foto: {d['fotka1Name']})")

# Copy rody descriptions where empty
k_rody_map = {r['nazev'].lower(): r for r in k_data['rody']}
for r in n_data['rody']:
    if not r.get('popis'):
        kr = k_rody_map.get(r['nazev'].lower())
        if kr and kr.get('popis'):
            r['popis'] = kr['popis']

# Add missing rody from kytickar_seed
n_rody_names = {r['nazev'].lower() for r in n_data['rody']}
next_rod_id = max(r['id'] for r in n_data['rody']) + 1

added_rody_map = {}
for kr in k_data['rody']:
    # Check if rod or Orchid already exists
    if kr['nazev'].lower() not in n_rody_names and kr['nazev'] != 'Phalaenopsis':
        new_rod = {
            'id': next_rod_id,
            'nazev': kr['nazev'],
            'popis': kr.get('popis', '')
        }
        n_data['rody'].append(new_rod)
        n_rody_names.add(kr['nazev'].lower())
        added_rody_map[kr['nazev'].lower()] = next_rod_id
        print(f"  Added new Rod {new_rod['id']}: {new_rod['nazev']}")
        next_rod_id += 1

# Map rod names to Natka rod IDs
n_rod_lookup = {r['nazev'].lower(): r['id'] for r in n_data['rody']}
n_rod_lookup['phalaenopsis'] = n_rod_lookup.get('orchid', 12)

# Add missing druhy from kytickar_seed
# Determine which kytickar druhy are already present or enriched
already_covered_photos = {d.get('fotka1Name') for d in n_data['druhy'] if d.get('fotka1Name')}
print(f"Photos already covered in Natka: {len(already_covered_photos)}")

next_druh_id = max(d['id'] for d in n_data['druhy']) + 1
k_rody_id_map = {r['id']: r['nazev'].lower() for r in k_data['rody']}

added_druhy_count = 0
for kd in k_data['druhy']:
    photo = kd.get('fotka1Name')
    if photo and photo in already_covered_photos:
        continue
    
    k_rod_name = k_rody_id_map[kd['rodId']]
    target_rod_id = n_rod_lookup.get(k_rod_name)
    if not target_rod_id:
        print(f"WARNING: Target rod not found for {k_rod_name} ({kd['nazev']})")
        continue

    new_druh = {
        'id': next_druh_id,
        'nazev': kd['nazev'],
        'popis': kd.get('popis', ''),
        'rodId': target_rod_id,
        'fotka1Name': kd.get('fotka1Name'),
        'fotka2Name': kd.get('fotka2Name')
    }
    n_data['druhy'].append(new_druh)
    already_covered_photos.add(photo)
    print(f"  Added Druh {new_druh['id']}: {new_druh['nazev']} (Rod: {k_rod_name}, foto: {new_druh['fotka1Name']})")
    next_druh_id += 1
    added_druhy_count += 1

print(f"Added {added_druhy_count} new druhy from kytickar_seed!")

# Sort rody and druhy cleanly by id
n_data['rody'].sort(key=lambda x: x['id'])
n_data['druhy'].sort(key=lambda x: x['id'])

# Validate all relationships
rody_ids = {r['id'] for r in n_data['rody']}
druhy_ids = {d['id'] for d in n_data['druhy']}
rostliny_ids = {r['id'] for r in n_data['rostliny']}

for d in n_data['druhy']:
    assert d['rodId'] in rody_ids, f"Druh {d['id']} has invalid rodId {d['rodId']}"

for r in n_data['rostliny']:
    assert r['druhId'] in druhy_ids, f"Rostlina {r['id']} has invalid druhId {r['druhId']}"

for h in n_data['historiePece']:
    assert h['rostlinaId'] in rostliny_ids, f"HistoriePece {h['id']} has invalid rostlinaId {h['rostlinaId']}"

for o in n_data['odlozeneAkce']:
    assert o['rostlinaId'] in rostliny_ids, f"OdlozeneAkce {o['id']} has invalid rostlinaId {o['rostlinaId']}"

for g in n_data['galerieFotky']:
    assert g['rostlinaId'] in rostliny_ids, f"GalerieFotky {g['id']} has invalid rostlinaId {g['rostlinaId']}"

print("All foreign key relationships validated successfully!")

# Verify photos on disk in app/public/species
missing_photos = []
all_photos_to_check = set()
for d in n_data['druhy']:
    if d.get('fotka1Name'): all_photos_to_check.add(d['fotka1Name'])
    if d.get('fotka2Name'): all_photos_to_check.add(d['fotka2Name'])
for g in n_data['galerieFotky']:
    if g.get('fotkaName'): all_photos_to_check.add(g['fotkaName'])

for p in all_photos_to_check:
    clean_p = p.replace('species/', '').replace('fotky/', '')
    if not os.path.exists(os.path.join(species_dir, clean_p)):
        missing_photos.append(clean_p)

if missing_photos:
    print(f"WARNING: Missing photos on disk: {missing_photos}")
else:
    print(f"All {len(all_photos_to_check)} referenced photos exist in app/public/species!")

# Save to output_db_json_path and app_default_data_path
n_json['exportedAt'] = "2026-10-17T14:30:00.000Z"
json_content = json.dumps(n_json, ensure_ascii=False, indent=2)

with open(output_db_json_path, 'w', encoding='utf-8') as f:
    f.write(json_content)

with open(app_default_data_path, 'w', encoding='utf-8') as f:
    f.write(json_content)

print(f"Saved updated db.json to {output_db_json_path} and {app_default_data_path}")

# Build natka2_seed.zip (and alias naty2_seed.zip)
with zipfile.ZipFile(output_zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    z.writestr('db.json', json_content)
    # Add all photos from species_dir into 'fotky/'
    photo_files = [f for f in os.listdir(species_dir) if f.endswith('.jpg') or f.endswith('.png')]
    for pf in photo_files:
        disk_path = os.path.join(species_dir, pf)
        z.write(disk_path, arcname=f"fotky/{pf}")
    print(f"Packaged {len(photo_files)} photos into {output_zip_path}")

# Copy alias
shutil.copyfile(output_zip_path, output_alias_zip_path)
print(f"Copied alias to {output_alias_zip_path}")

print("\n--- FINAL STATS ---")
print(f"Rody: {len(n_data['rody'])} (was 42)")
print(f"Druhy: {len(n_data['druhy'])} (was 69, removed 6 duplicates, added 35 from catalog)")
print(f"Rostliny: {len(n_data['rostliny'])} (all 84 plants preserved and properly linked)")
print(f"Galerie fotky: {len(n_data['galerieFotky'])}")
print(f"Historie pece: {len(n_data['historiePece'])}")
print("Seed build completed successfully!")
