// Importar desde Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBLlhCA7gSrCYdZLIRVUn21megmjFbcgzo",
  authDomain: "crud-original.firebaseapp.com",
  projectId: "crud-original",
  storageBucket: "crud-original.firebasestorage.app",
  messagingSenderId: "187275652270",
  appId: "1:187275652270:web:dc38d5a0e903c5dd48113f"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos del DOM
const btnIngresar = document.getElementById('btnIngresar');
const inputUser = document.getElementById('inputUser');
const inputPassword = document.getElementById('inputPassword');

btnIngresar.addEventListener('click', async () => {
  let valorUser = inputUser.value.trim();
  const valorPassword = inputPassword.value.trim();
  
  const usuariosRef = collection(db, "empleados");
  const querySnapshot = await getDocs(usuariosRef);

  let usuarioEncontrado = null;

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.user === valorUser.toLowerCase() && data.password === valorPassword) {
      usuarioEncontrado = data;
    }
  });

  if (usuarioEncontrado) {
    // NUEVO: Guardar el usuario autenticado en sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(usuarioEncontrado));
    
    alert("✅ ¡Login exitoso!");
    
    // Redirigir según el puesto
    switch (usuarioEncontrado.puesto) {
      case "administrador":
      case "Gerente General":
        window.location.href = "panel-admin.html"; // Interfaz para admin y gerente
        break;
      case "contador":
        window.location.href = "panel-contador.html"; // Interfaz para contador
        break;
      case "vendedor":
        window.location.href = "panel-contador.html"; // Interfaz para vendedor
        break;
      default:
        window.location.href = "panel-contador.html"; // Interfaz por defecto
        break;
    }
  } else {
    // Usuario o contraseña incorrectos
    alert("❌ Usuario o contraseña incorrectos");
  }

  // Limpiar inputs
  inputUser.value = "";
  inputPassword.value = "";
});

