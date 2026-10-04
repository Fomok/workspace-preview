<script>
 let setup=$state({game:'gamma',sota:false,devices:false,looting:false,bodycam:false});
 let steps=$derived(window.InstallationGuide.steps(setup));
</script>
<details class="installation-checklist"><summary>Build your installation checklist</summary><div><p class="hint">Choose your setup. This checklist does not detect installed mods.</p><label>Your game <select bind:value={setup.game}><option value="gamma">GAMMA</option><option value="anomaly">Anomaly 1.5.3</option></select></label><div class="checklist-options">{#each [['bodycam','Bodycam (DX11-AVX)'],['sota','SOTA UI'],['devices','Wearable Devices'],['looting','Looting Takes Time Redux']] as [key,label]}<label><input type="checkbox" bind:checked={setup[key]}>{label}</label>{/each}</div>{#each steps as [id,text] (id+text)}<label class="checklist-step"><input type="checkbox"><span>{text}</span></label>{/each}</div></details>
