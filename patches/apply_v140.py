#!/usr/bin/env python3
"""DroidAtlas v1.2.6: merge v1.40 Fusion / Scourge data into existing production."""
import json, re, html as htmllib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION="1.2.6"
FUSIONS=[
("ION Probe","Worker","Common",["Mouse","Mouse","ID10"]),
("Quad Sentry","Astromech","Common",["R5","R5","ID10"]),
("LFT-3R","Battle","Common",["Gonk","Imperial Probe","Imperial Probe"]),
("BI-Bit","Astromech","Epic",["EGL","R9","R9"]),
("STRD-3","Worker","Epic",["MPH","Senate Hovercam","Senate Hovercam"]),
("HV-EE","Astromech","Legendary",["JO9-4MN","BB9","BB9"]),
("TOR-Q","Battle","Legendary",["B2-RP","KT","KT"]),
("AX-L","Battle","Mythic",["IG","IG","MPH"]),
("MO-TRO","Astromech","Mythic",["ECG","A-LT","A-LT"]),
("KL-NK","Protocol","Mythic",["RIC","PZ","PZ"]),
("SKM-MR","Astromech","Mythic",["Snow Mouse","A-LT","A-LT"])]
ALIASES={"OPT-R":"OPT-AR","AXL-POD":"AXI-POD"}
def save(path,content):
 path.parent.mkdir(parents=True,exist_ok=True)
 if not path.exists() or path.read_text(encoding="utf-8")!=content:
  path.write_text(content,encoding="utf-8")
  print("Updated",path.relative_to(ROOT))
def sub(text,pattern,repl,label):
 out,n=re.subn(pattern,repl,text,count=1,flags=re.S)
 if n!=1:raise RuntimeError("Missing release anchor: "+label)
 return out
data_path=ROOT/"production-update/game-data.json"
index_path=ROOT/"index.html"
worker_path=ROOT/"service-worker.js"
data=json.loads(data_path.read_text(encoding="utf-8"))
old_rows=json.dumps(data["rebirths"],sort_keys=True)
for entry in data["roster"]:
 entry["name"]=ALIASES.get(entry["name"],entry["name"])
names={d["name"] for d in data["roster"]}
for name,cls,rarity,_ in FUSIONS:
 if name not in names:
  data["roster"].append({"name":name,"class":cls,"rarity":rarity,"type":"Fusion"})
  names.add(name)
if "D-O" not in names:data["roster"].append({"name":"D-O","class":"Worker","rarity":"Iconic","type":"Iconic"})
if "Scourge" not in data["variants"]:data["variants"].append("Scourge")
data["version"]="1.2.6-game-v1.40-2026.11.27-rb39-verified"
data["sources"]["official140"]="https://communities.epicgames.com/thread/new-fusion-droids-v1-40-0/i9zr"
data["sources"]["community140"]="https://www.reddit.com/r/StarWarsDroidTycoon/comments/1y5ci54/"
data["variantStatus"]="Scourge is a distinct historical acquisition finish; per-droid eligibility needs in-game confirmation."
data["rosterStatus"]="112 entries. New Fusion rarities and ingredients are community reported, awaiting in-game verification."
assert json.dumps(data["rebirths"],sort_keys=True)==old_rows
assert len(data["roster"])==112 and len({d["name"] for d in data["roster"]})==112
assert next(d for d in data["roster"] if d["name"]=="Proto-Roller")["rarity"]=="Legendary"
assert data["variants"][-1]=="Scourge"
assert data["rebirths"]["4"]["36"]["credits"]=="1.19Qa" and data["rebirths"]["4"]["36"]["creditsStatus"]=="verified-ingame"
assert data["rebirths"]["4"]["37"]["credits"]=="2.5Qa" and data["rebirths"]["4"]["37"]["creditsStatus"]=="verified-ingame" and data["rebirths"]["4"]["37"]["requirementsStatus"]=="verified-ingame"
assert data["rebirths"]["4"]["38"]["credits"]=="4.5Qa" and data["rebirths"]["4"]["38"]["creditsStatus"]=="verified-ingame" and data["rebirths"]["4"]["38"]["requirementsStatus"]=="verified-ingame"
assert data["rebirths"]["4"]["39"]["credits"]=="8Qa" and data["rebirths"]["4"]["39"]["creditsStatus"]=="verified-ingame" and data["rebirths"]["4"]["39"]["requirementsStatus"]=="verified-ingame"
save(data_path,json.dumps(data,ensure_ascii=False,indent=2)+"\n")
app=index_path.read_text(encoding="utf-8")
assert '<script id="game-data" type="application/json">' in app,"Expected production 1.2.1 app"
embedded=json.dumps(data,ensure_ascii=False,separators=(",",":")).replace("<",r"\u003c")
app=sub(app,r'(<script id="game-data" type="application/json">).*?(</script>)',lambda m:m[1]+embedded+m[2],"embedded game-data")
m=re.search(r'const DROIDEX_FUSION_RECIPES=(\{[^;]+\});',app)
assert m,"Missing existing Fusion recipes"
original=json.loads(m[1])
recipes={ALIASES.get(k,k):[("BDX Explorer" if i.strip()=="BDX" else i.strip()) for i in v.split(" + ")] for k,v in original.items()}
for name,_,_,items in FUSIONS:recipes[name]=items
assert len(recipes)==28,("Expected 28 recipes",len(recipes))
compact={k:" + ".join(items) for k,items in recipes.items()}
app=app[:m.start()]+"const DROIDEX_FUSION_RECIPES="+json.dumps(compact,ensure_ascii=False,separators=(",",":"))+";"+app[m.end():]
if "const dxKey=(n,v)=>n+'||'+v;" in app:
 app=app.replace("const dxKey=(n,v)=>n+'||'+v;","const dxKey=(n,v)=>({'OPT-AR':'OPT-R','AXI-POD':'AXL-POD'}[n]||n)+'||'+v;",1)
else:assert "'OPT-AR':'OPT-R'" in app,"Unknown historic acquisition key scheme"
ranks={d["name"]:d["rarity"] for d in data["roster"]}
new={x[0] for x in FUSIONS}
card_sections=[]
for rarity in ["Common","Rare","Epic","Legendary","Mythic"]:
 cards=[]
 for name,items in recipes.items():
  if ranks[name]!=rarity:continue
  chips=" + ".join('<span class="ingredient">'+htmllib.escape(v,quote=True)+"</span>" for v in items)
  status="Community reported · v1.40" if name in new else "Verified · In Game (legacy)"
  cards.append('<section class="fusionCard"><div class="fusionTop"><div class="fusionResult">'+htmllib.escape(name,quote=True)+'</div><span class="rarity rarity-'+rarity.lower()+'">'+rarity+'</span></div><div class="fusionArrow">FUSION RECIPE</div><div class="ingredients">'+chips+'</div><div class="fusionStatus">'+status+'</div></section>')
 if cards:card_sections.append('<section class="fusionGroup"><h2>'+rarity+'</h2><div class="fusionGrid">'+''.join(cards)+'</div></section>')
section='<div id="fusionView" class="appView" hidden>\n<section class="fusionIntro"><div class="fusionTitle">Fusion Recipes</div><div class="fusionCount">28 known recipes</div><p>17 legacy recipes and 11 new community-reported recipes (game v1.40). Verify ingredients in-game before spending resources.</p></section>\n'+"\n".join(card_sections)+"\n</div>\n\n"
app=sub(app,r'<div id="fusionView" class="appView" hidden>.*?(?=<div id="droidexView")',lambda _:section,"Fusion module")
style="""<style id="droidatlas-scourge-finish">
#droidexView .dxVariant[data-variant="Scourge"]{color:#edcaf6;border-color:#a44ac4;background:linear-gradient(145deg,#351342,#13081f 72%);box-shadow:inset 0 0 9px rgba(199,65,215,.22),0 0 0 1px rgba(116,30,145,.14)}
#droidexView .dxVariant[data-variant="Scourge"].filled{color:#fff2fd;border:1px solid #e58dfd;background:linear-gradient(135deg,#6e1d83,#361044 65%,#510f5a);box-shadow:inset 0 0 14px rgba(247,139,255,.38),0 0 9px rgba(193,57,207,.25)}
</style>"""
if 'id="droidatlas-scourge-finish"' not in app:app=app.replace("</head>",style+"\n</head>",1)
app=app.replace("browse all 17 in-game-validated Fusion recipes","browse all 28 Fusion recipes (11 new; community reported)")
app=app.replace("DROIDATLAS 1.2.1","DROIDATLAS 1.2.6").replace('content="1.2.1"','content="1.2.6"').replace("Data review 2026-11-05","Data review 2026-11-26 · Fusion update v1.40")
assert "REPORTED LAST NEED" in app and "exportCollection" in app and "28 known recipes" in app
assert "droidatlas-droidex-v1" in app and "droidatlas-tab" in app
save(index_path,app)
save(ROOT/"release/index.html",app)
worker=worker_path.read_text(encoding="utf-8")
worker=sub(worker,r"const CACHE_NAME='droidatlas-[^']+';","const CACHE_NAME='droidatlas-1.2.6-data-20261127-rb39-v1';","service worker cache")
save(worker_path,worker)
save(ROOT/"release/service-worker.js",worker)
reg=ROOT/"tests/regression.cjs"
if reg.exists():
 text=reg.read_text(encoding="utf-8").replace("assert.equal(await page.locator('.dxVariant.filled').count(),11);","assert.equal(await page.locator('.dxVariant.filled').count(),12);").replace("assert.equal(await page.locator('.dxCard').count(),5);","assert.equal(await page.locator('.dxCard').count(),6);")
 save(reg,text)
release_test=ROOT/"tests/release.cjs"
if release_test.exists():
 text=release_test.read_text(encoding="utf-8").replace("1.2.1","1.2.6").replace("1000$/","1223$/")
 save(release_test,text)
pkg=ROOT/"package.json"
p=json.loads(pkg.read_text(encoding="utf-8"))
p["version"]="1.2.6"
if "python3 patches/apply_v140.py" not in p["scripts"]["build"]:
 p["scripts"]["build"]+=" && python3 patches/apply_v140.py"
save(pkg,json.dumps(p,indent=2)+"\n")
print("PASS: six-cycle Rebirth data preserved, 112 droids, 28 Fusion recipes, 1223 history slots. Run npm test before release.")
