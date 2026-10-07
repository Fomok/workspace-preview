<script>
 let {changed}=$props();
 let email=$state(''),code=$state(''),phrase=$state(''),sent=$state(false),busy=$state(false),error=$state(''),name=$state(window.Community.user?.name||'');
 async function run(fn){busy=true;error='';try{await fn();}catch(e){error=e.message;}finally{busy=false;}}
</script>
{#if window.Community.user}
<label>Display name<input bind:value={name} maxlength="60"/></label><button class="tool" disabled={busy} onclick={()=>run(async()=>{if(name.trim().length<2)throw Error('Enter at least two characters.');await window.Community.name(name.trim());await changed();})}>Save name</button>
<button class="tool" disabled={busy} onclick={()=>run(async()=>{await window.Community.signOut();await changed();})}>Sign out</button>
{:else}
<form onsubmit={e=>{e.preventDefault();run(async()=>{if(sent){await window.Community.verify(code.trim());await changed();}else{phrase=await window.Community.sendCode(email.trim());sent=true;}});}}>
<label>Email address<input type="email" bind:value={email} required disabled={sent||busy} autocomplete="email"/></label>
{#if sent}<p>Enter the code from your email.</p>{#if phrase}<p>Check this phrase: <strong>{phrase}</strong></p>{/if}<label>Sign-in code<input bind:value={code} required autocomplete="one-time-code" inputmode="numeric"/></label>{/if}
<button class="tool primary" disabled={busy}>{busy?'Please wait…':sent?'Sign in':'Send sign-in code'}</button>
{#if sent}<button class="tool" type="button" disabled={busy} onclick={()=>{sent=false;code='';}}>Use another email</button>{/if}
</form>
{/if}
{#if error}<p role="alert">{error}</p>{/if}
<style>label{display:grid;gap:7px;margin:12px 0;font-size:13px}input{width:100%;box-sizing:border-box;padding:12px;background:#111611;border:1px solid #5c6552;color:#eee}button{margin:5px 7px 5px 0}p{font-size:12px;line-height:1.5}</style>
