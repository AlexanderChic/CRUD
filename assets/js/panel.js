// panel.js
// Importar Firebase - asegúrate de que las rutas sean correctas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Al inicio o final del archivo panel.js
document.addEventListener('DOMContentLoaded', () => {
  // Si hay un usuario autenticado, cargar los datos del dashboard
  if (currentUser) {
    cargarDatosDashboard();
  }
});

// Configuración Firebase - debe ser idéntica a la de script.js
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
const auth = getAuth(app);

// Recuperar la información del usuario desde sessionStorage
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

// Actualizar UI con el nombre de usuario
const userNameElement = document.getElementById('user-name');

// Si hay un usuario autenticado
if (currentUser) {
  // Acceder al nombre de usuario y mostrarlo en la interfaz
  const valorUser = currentUser.nombre;
  
  if (userNameElement) {
    userNameElement.textContent = valorUser;
  }
  
  // Cargar datos del dashboard
  cargarDatosDashboard();
  
} else {
  // No hay usuario autenticado, redirigir al login
  console.log("No hay sesión activa");
  window.location.href = "index.html"; // Redirigir al login
}

// Función para cargar todos los datos del dashboard
async function cargarDatosDashboard() {
  try {
    // Cargar contadores para las tarjetas
    await cargarContadores();
    
    // Cargar últimas ventas para la tabla
    await cargarUltimasVentas();
    
  } catch (error) {
    console.error("Error al cargar datos del dashboard:", error);
  }
}

// Función para cargar los contadores de las tarjetas
async function cargarContadores() {
  try {
    // Contar productos
    const productosRef = collection(db, "productos");
    const productosSnapshot = await getDocs(productosRef);
    const productosCount = productosSnapshot.size;
    const productosCountElement = document.getElementById('productos-count');
    if (productosCountElement) {
      productosCountElement.textContent = productosCount;
    }
    
    // Contar empleados
    const empleadosRef = collection(db, "empleados");
    const empleadosSnapshot = await getDocs(empleadosRef);
    const empleadosCount = empleadosSnapshot.size;
    const empleadosCountElement = document.getElementById('empleados-count');
    if (empleadosCountElement) {
      empleadosCountElement.textContent = empleadosCount;
    }
    
// Calcular total de ventas (suma de precios)
const ventasRef = collection(db, "venta"); // Cambio de "ventas" a "venta"
const ventasSnapshot = await getDocs(ventasRef);
let totalVentas = 0;

ventasSnapshot.forEach((doc) => {
  const venta = doc.data();
  totalVentas += venta.precio || 0;
});

const ventasTotalElement = document.getElementById('ventas-total');
if (ventasTotalElement) {
  ventasTotalElement.textContent = `$${totalVentas.toFixed(2)}`;
}
    
  } catch (error) {
    console.error("Error al cargar contadores:", error);
  }
}

// Función para cargar las últimas 5 ventas en la tabla
// Función para cargar las últimas 5 ventas en la tabla
async function cargarUltimasVentas() {
  try {
    const ventasTabla = document.getElementById('ventas-tabla');
    if (!ventasTabla) return;
    
    // Corregir el nombre de la colección a "venta" en singular
    const ventasRef = collection(db, "venta");
    const q = query(ventasRef, orderBy("fecha", "desc"), limit(5));
    const ventasSnapshot = await getDocs(q);
    
    // Limpiar tabla actual
    ventasTabla.innerHTML = '';
    
    if (ventasSnapshot.empty) {
      ventasTabla.innerHTML = `
        <tr>
          <td colspan="6" class="no-data">No hay ventas registradas</td>
        </tr>
      `;
      return;
    }
    
    // Agregar filas con datos de ventas
    ventasSnapshot.forEach((doc) => {
      const venta = doc.data();
      
      // Formateo de fecha (manejo de diferentes formatos de fecha posibles)
      let fechaFormateada = 'N/A';
      if (venta.fecha) {
        // Si es un timestamp de Firestore
        if (venta.fecha.seconds) {
          const fecha = new Date(venta.fecha.seconds * 1000);
          fechaFormateada = fecha.toLocaleDateString();
        } 
        // Si es un string, intentar convertirlo
        else if (typeof venta.fecha === 'string') {
          fechaFormateada = new Date(venta.fecha).toLocaleDateString();
        }
      }
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${doc.id.substring(0, 6)}...</td>
        <td>${venta.cliente || 'N/A'}</td>
        <td>${fechaFormateada}</td>
        <td>${venta.producto || 'N/A'}</td>
        <td>$${venta.precio ? venta.precio.toFixed(2) : '0.00'}</td>
        <td><span class="status ${venta.estado?.toLowerCase() || 'pendiente'}">${venta.estado || 'Pendiente'}</span></td>
      `;
      
      ventasTabla.appendChild(row);
    });
    
    console.log("Ventas cargadas:", ventasSnapshot.size); // Para depuración
    
  } catch (error) {
    console.error("Error al cargar últimas ventas:", error);
    
    const ventasTabla = document.getElementById('ventas-tabla');
    if (ventasTabla) {
      ventasTabla.innerHTML = `
        <tr>
          <td colspan="6" class="error-row">Error al cargar datos: ${error.message}</td>
        </tr>
      `;
    }
  }
}