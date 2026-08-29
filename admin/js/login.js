/* ============================================================
   LOGIN — handles auth form submit, stores JWT, redirects
============================================================ */

// If already logged in, skip straight to dashboard
if(localStorage.getItem('admin_token')){
  location.replace('dashboard.html');
}

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginError = document.getElementById('loginError');
const loginErrorText = document.getElementById('loginErrorText');

function setLoginLoading(loading){
  loginBtn.disabled = loading;
  loginBtnText.innerHTML = loading
    ? '<span class="spinner"></span> Logging in...'
    : 'Login';
}

function showLoginError(msg){
  loginErrorText.textContent = msg;
  loginError.classList.add('show');
}

function hideLoginError(){
  loginError.classList.remove('show');
}

loginForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  hideLoginError();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if(!email || !password){
    showLoginError('Please enter both email and password.');
    return;
  }

  setLoginLoading(true);

  // ---------------------------------------------------------------
  // TEMPORARY TEST LOGIN — no backend yet. Bypasses the real API
  // call for this one hardcoded account so the panel is usable
  // during frontend dev. DELETE this whole if-block (and the
  // "Test login" hint div in login.html) once real backend auth
  // is wired up via authApi.login().
  // ---------------------------------------------------------------
  if(email === 'admin@test.com' && password === 'admin123'){
    setTimeout(()=>{
      localStorage.setItem('admin_token', 'temp-dev-token');
      localStorage.setItem('admin_user', JSON.stringify({ name: 'Admin', email }));
      location.href = 'dashboard.html';
    }, 350); // small delay so the loading state is visible
    return;
  }
  // ---------------------------------------------------------------

  try{
    const res = await authApi.login(email, password);
    // Expected response: { token, admin: { name, email, ... } }
    if(!res || !res.token){
      throw { message: 'Unexpected response from server.' };
    }
    localStorage.setItem('admin_token', res.token);
    if(res.admin) localStorage.setItem('admin_user', JSON.stringify(res.admin));
    location.href = 'dashboard.html';
  }catch(err){
    setLoginLoading(false);
    showLoginError((err && err.message) || 'Invalid email or password.');
  }
});
