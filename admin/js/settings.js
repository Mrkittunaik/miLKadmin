/* ============================================================
   SETTINGS — max concurrent orders, delivery charge config,
   store location picker, save
============================================================ */

renderLayout('Settings');

const chargeTypeSelect = document.getElementById('sChargeType');
const flatFeeField = document.getElementById('flatFeeField');
const freeAboveField = document.getElementById('freeAboveField');
const freeAboveFallbackField = document.getElementById('freeAboveFallbackField');
const perKmField = document.getElementById('perKmField');

function updateConditionalFields(){
  const type = chargeTypeSelect.value;
  flatFeeField.classList.toggle('show', type === 'flat');
  freeAboveField.classList.toggle('show', type === 'free_above');
  freeAboveFallbackField.classList.toggle('show', type === 'free_above');
  perKmField.classList.toggle('show', type === 'per_km');
}
chargeTypeSelect.addEventListener('change', updateConditionalFields);

document.getElementById('storeLocationPicker').addEventListener('click', ()=>{
  if(!navigator.geolocation){
    showToast('Geolocation not supported by this browser', 'error');
    return;
  }
  const label = document.getElementById('storeLocationLabel');
  label.textContent = 'Locating...';
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      document.getElementById('sStoreLat').value = pos.coords.latitude;
      document.getElementById('sStoreLng').value = pos.coords.longitude;
      label.textContent = `Location set: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
    },
    ()=>{ label.textContent = 'Could not get location — click to retry'; },
    { enableHighAccuracy: true }
  );
});

async function loadSettings(){
  try{
    const s = await settingsApi.get();
    document.getElementById('sMaxOrders').value = s.defaultMaxConcurrentOrders ?? 5;
    chargeTypeSelect.value = s.deliveryChargeType || 'flat';
    document.getElementById('sFlatFee').value = s.flatFee ?? '';
    document.getElementById('sFreeAboveAmount').value = s.freeAboveAmount ?? '';
    document.getElementById('sFreeAboveFallback').value = s.freeAboveFallback ?? '';
    document.getElementById('sPerKmRate').value = s.perKmRate ?? '';
    if(s.storeLocation){
      document.getElementById('sStoreLat').value = s.storeLocation.lat;
      document.getElementById('sStoreLng').value = s.storeLocation.lng;
      document.getElementById('storeLocationLabel').textContent = `Location set: ${s.storeLocation.lat}, ${s.storeLocation.lng}`;
    }
    updateConditionalFields();
  }catch(err){
    handleApiError(err, 'Failed to load settings.');
  }
}

document.getElementById('settingsForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const btn = document.getElementById('saveSettingsBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner dark"></span> Saving...';

  const body = {
    defaultMaxConcurrentOrders: Number(document.getElementById('sMaxOrders').value),
    deliveryChargeType: chargeTypeSelect.value,
    flatFee: Number(document.getElementById('sFlatFee').value || 0),
    freeAboveAmount: Number(document.getElementById('sFreeAboveAmount').value || 0),
    freeAboveFallback: Number(document.getElementById('sFreeAboveFallback').value || 0),
    perKmRate: Number(document.getElementById('sPerKmRate').value || 0),
    storeLocation: (document.getElementById('sStoreLat').value && document.getElementById('sStoreLng').value)
      ? { lat: Number(document.getElementById('sStoreLat').value), lng: Number(document.getElementById('sStoreLng').value) }
      : null,
  };

  try{
    await settingsApi.update(body);
    showToast('Settings saved', 'success');
  }catch(err){
    handleApiError(err, 'Failed to save settings.');
  }finally{
    btn.disabled = false;
    btn.textContent = 'Save Settings';
  }
});

loadSettings();
