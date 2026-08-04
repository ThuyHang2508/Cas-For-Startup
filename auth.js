(function(){
  const USERNAME = 'casso';
  const PASSWORD = '200khachhang';
  const AUTH_KEY = 'cas-crm-auth-ok';

  function loadApp(){
    ['sheets-config.js?v=20260804-13','app.js?v=20260804-13'].forEach(src=>{
      const s=document.createElement('script');
      s.src=src;
      document.body.appendChild(s);
    });
  }

  function unlock(){
    document.body.classList.remove('locked');
    const gate=document.getElementById('authGate');
    if(gate) gate.remove();
    loadApp();
  }

  if(localStorage.getItem(AUTH_KEY)==='1'){
    unlock();
    return;
  }

  document.body.classList.add('locked');
  const gate=document.createElement('div');
  gate.id='authGate';
  gate.innerHTML=`
    <form id="authForm" class="auth-card">
      <img src="logo.svg" alt="CAS" class="auth-logo" />
      <h1>Đăng nhập CAS CRM</h1>
      <label>Tài khoản<input id="authUser" autocomplete="username" required /></label>
      <label>Mật khẩu<input id="authPass" type="password" autocomplete="current-password" required /></label>
      <p id="authError" class="auth-error"></p>
      <button type="submit" class="btn primary">Đăng nhập</button>
    </form>`;
  document.body.prepend(gate);

  document.getElementById('authForm').addEventListener('submit', e=>{
    e.preventDefault();
    const user=document.getElementById('authUser').value.trim();
    const pass=document.getElementById('authPass').value;
    if(user===USERNAME && pass===PASSWORD){
      localStorage.setItem(AUTH_KEY,'1');
      unlock();
    } else {
      document.getElementById('authError').textContent='Sai tài khoản hoặc mật khẩu.';
    }
  });
})();
