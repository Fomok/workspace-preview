import sys, subprocess, tempfile
from pathlib import Path
sys.path.insert(0,str(Path.cwd().parent/'test-deps'))
from lupa.lua51 import LuaRuntime
lua=LuaRuntime(unpack_returned_tuples=True)
lua.execute('''
A={POUCHES={},DROP_DEF={},DROP_COND={}}
A.rigs_at=function(tier) if tier==1 then return {"amprig_bandolier","external_rig"} else return {} end end
A.pouches_at=function(col) return {"af_magpouch_s","amppouch_test_new"} end
zzz_armor_mag_pouches={amp_wd_seam=function() return A end}
''')
script = subprocess.check_output(['node', 'tests/runtime_fixture.cjs'], text=True, encoding='utf-8')
lua.execute(script)
lua.execute('''
on_game_start()
local got=A.rigs_at(1)
assert(got[1]=="external_rig")
local found=0
for _, id in ipairs(got) do assert(id~="amprig_bandolier"); if id=="amprig_test_new" then found=found+1 end end
assert(found==1)
assert(A.POUCHES[1]=="amppouch_test_new")
assert(A.DROP_DEF.novice[1]==10)
assert(A.DROP_COND.legend[2]==55)
on_game_start()
assert(#A.POUCHES==1)
''')
print('Lua 5.1 registration: custom rig, removed rig, pouch registration, drop/condition defaults and idempotency PASS')
