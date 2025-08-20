// Script para debuggear autenticación
// Ejecutar en la consola del navegador

console.log('=== DEBUG AUTENTICACIÓN ===');

// Verificar token en localStorage
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('Token en localStorage:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');
console.log('Usuario en localStorage:', user ? JSON.parse(user) : 'NO USER');

// Verificar si coincide con el token del backend
const expectedToken = '92daeff4691e432c9fefc2075ee025cbc15d26e6';
console.log('Token esperado del backend:', `${expectedToken.substring(0, 10)}...`);
console.log('Tokens coinciden:', token === expectedToken);

// Hacer prueba de autenticación
if (token) {
  fetch('/api/usuarios/fiadores/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Status de prueba:', response.status);
    if (response.status === 401) {
      console.log('❌ Token inválido o expirado');
    } else if (response.status === 200) {
      console.log('✅ Token válido');
    }
    return response.text();
  })
  .then(data => {
    console.log('Respuesta:', data);
  })
  .catch(error => {
    console.error('Error en prueba:', error);
  });
} else {
  console.log('❌ No hay token para probar');
}

// Función para forzar login con credenciales correctas
window.debugLogin = function() {
  fetch('/api/usuarios/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'master',
      password: 'master123'
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Login response:', data);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✅ Login exitoso, token guardado:', data.token.substring(0, 10) + '...');
      location.reload();
    } else {
      console.error('❌ No se recibió token en la respuesta');
    }
  })
  .catch(error => {
    console.error('Error en login:', error);
  });
};

// Función para verificar token actual
window.checkToken = function() {
  const currentToken = localStorage.getItem('token');
  console.log('Token actual:', currentToken ? currentToken.substring(0, 10) + '...' : 'NO TOKEN');
  
  // Tokens válidos del backend
  const validTokens = {
    admin: '2470d8fa4a9ec830e46517abac785c47c1e07b0c',
    master: '9f3b825acabc01293986fdcaa3b0ec1b4caac78b'
  };
  
  console.log('Tokens válidos:');
  console.log('  Admin:', validTokens.admin.substring(0, 10) + '...');
  console.log('  Master:', validTokens.master.substring(0, 10) + '...');
  
  const isValidToken = Object.values(validTokens).includes(currentToken);
  console.log('¿Token actual es válido?', isValidToken ? '✅ SÍ' : '❌ NO');
  
  if (!isValidToken) {
    console.log('🔄 Token inválido, usando token de admin...');
    localStorage.setItem('token', validTokens.admin);
    console.log('✅ Token actualizado a admin');
    
    // También actualizar usuario
    const adminUser = {
      id: 1,
      username: 'admin',
      email: 'admin@concesionario.com',
      is_staff: true,
      is_superuser: true
    };
    localStorage.setItem('user', JSON.stringify(adminUser));
    console.log('✅ Usuario actualizado a admin');
  }
};

console.log('Para hacer login forzado, ejecuta: debugLogin()');