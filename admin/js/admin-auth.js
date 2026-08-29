/* ============================================================
   ADMIN-AUTH — login handler, token storage/check, route guard
   This file must load FIRST on every protected page. It redirects
   to login.html immediately if there is no token.
============================================================ */

(function guardRoute(){
  const isLoginPage = location.pathname.endsWith('login.html');
  const token = localStorage.getItem('admin_token');
  if(!token && !isLoginPage){
    location.replace('login.html');
  }
  if(token && isLoginPage){
    location.replace('dashboard.html');
  }
})();

function setSession(token, admin){
  localStorage.setItem('admin_token', token);
  if(admin) localStorage.setItem('admin_user', JSON.stringify(admin));
}

function clearSession(){
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

function getCurrentAdmin(){
  try{
    return JSON.parse(localStorage.getItem('admin_user') || 'null');
  }catch(e){ return null; }
}

function logoutAdmin(){
  clearSession();
  location.href = 'login.html';
}
