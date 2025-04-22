// ventas.js
// Importar Firebase - asegúrate de que las rutas sean correctas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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
const auth = getAuth(app);

// Variables globales
let currentVentaId = null;
let isEditing = false;

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
  
  // Cargar datos de ventas
  cargarVentas();
  
} else {
  // No hay usuario autenticado, redirigir al login
  console.log("No hay sesión activa");
  window.location.href = "index.html"; // Redirigir al login
}

// Función para formatear la fecha
function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  
  // Si es un timestamp de Firestore
  if (fecha.toDate && typeof fecha.toDate === 'function') {
    fecha = fecha.toDate();
  } else if (typeof fecha === 'string') {
    // Si es una fecha en formato string
    fecha = new Date(fecha);
  }
  
  return fecha instanceof Date && !isNaN(fecha) ? 
    fecha.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
}

// Función para cargar las ventas desde Firestore
async function cargarVentas() {
  try {
    const ventasTabla = document.getElementById('ventas-tabla');
    if (!ventasTabla) return;
    
    const ventasRef = collection(db, "venta");
    const ventasSnapshot = await getDocs(ventasRef);
    
    // Limpiar tabla actual
    ventasTabla.innerHTML = '';
    
    if (ventasSnapshot.empty) {
      ventasTabla.innerHTML = `
        <tr>
          <td colspan="7" class="no-data">No hay ventas registradas</td>
        </tr>
      `;
      return;
    }
    
    // Agregar filas con datos de ventas
    ventasSnapshot.forEach((doc) => {
      const venta = doc.data();
      const ventaId = doc.id;
      
      const row = document.createElement('tr');
      
      // Aplicar clase según el estado
      if (venta.estado === 'Completada') {
        row.classList.add('estado-completada');
      } else if (venta.estado === 'Cancelada') {
        row.classList.add('estado-cancelada');
      }
      
      row.innerHTML = `
        <td>${ventaId.substring(0, 6)}...</td>
        <td>${venta.cliente || 'N/A'}</td>
        <td>${formatearFecha(venta.fecha)}</td>
        <td>${venta.producto || 'N/A'}</td>
        <td>Q${venta.precio ? venta.precio.toFixed(2) : '0.00'}</td>
        <td><span class="estado-badge estado-${venta.estado?.toLowerCase() || 'pendiente'}">${venta.estado || 'Pendiente'}</span></td>
        <td class="acciones">
          <button class="btn-editar" data-id="${ventaId}"><i class="fas fa-edit"></i></button>
          <button class="btn-eliminar" data-id="${ventaId}"><i class="fas fa-trash-alt"></i></button>
        </td>
      `;
      
      ventasTabla.appendChild(row);
    });
    
    // Añadir event listeners para los botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
          eliminarVenta(id);
        }
      });
    });
    
    // Añadir event listeners para los botones de editar
    document.querySelectorAll('.btn-editar').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        cargarVentaParaEditar(id);
      });
    });
    
    console.log("Ventas cargadas:", ventasSnapshot.size); // Para depuración
    
  } catch (error) {
    console.error("Error al cargar ventas:", error);
    
    const ventasTabla = document.getElementById('ventas-tabla');
    if (ventasTabla) {
      ventasTabla.innerHTML = `
        <tr>
          <td colspan="7" class="error-row">Error al cargar datos: ${error.message}</td>
        </tr>
      `;
    }
  }
}

// Función para cargar una venta para editar
async function cargarVentaParaEditar(id) {
  try {
    const ventaDoc = await getDoc(doc(db, "venta", id));
    
    if (ventaDoc.exists()) {
      const venta = ventaDoc.data();
      
      // Formatear la fecha para el input date
      let fechaFormateada = venta.fecha;
      if (venta.fecha && venta.fecha.toDate && typeof venta.fecha.toDate === 'function') {
        const fechaObj = venta.fecha.toDate();
        fechaFormateada = fechaObj.toISOString().split('T')[0];
      } else if (typeof venta.fecha === 'string') {
        const fechaObj = new Date(venta.fecha);
        fechaFormateada = fechaObj.toISOString().split('T')[0];
      }
      
      // Actualizar el formulario con los datos de la venta
      document.getElementById('cliente').value = venta.cliente || '';
      document.getElementById('fecha').value = fechaFormateada || '';
      document.getElementById('producto').value = venta.producto || '';
      document.getElementById('precio').value = venta.precio || '';
      document.getElementById('estado').value = venta.estado || 'Pendiente';
      
      // Actualizar estado de la aplicación
      currentVentaId = id;
      isEditing = true;
      
      // Cambiar el título del formulario
      const formTitle = document.getElementById('form-title');
      if (formTitle) {
        formTitle.textContent = 'Editar Venta';
      }
      
      // Cambiar el texto del botón a "Actualizar"
      const submitButton = document.querySelector('#venta-form button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = 'Actualizar Venta';
      }
      
      // Mostrar botón para cancelar edición
      const cancelButton = document.querySelector('#venta-form button[type="reset"]');
      if (cancelButton) {
        cancelButton.textContent = 'Cancelar';
      }
      
      // Resaltar el formulario para indicar edición
      document.querySelector('.form-container').classList.add('editing');
      
      // Scroll hacia el formulario
      document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    } else {
      console.error("No se encontró la venta");
      alert("No se encontró la venta solicitada");
    }
  } catch (error) {
    console.error("Error al cargar venta para editar:", error);
    alert("Error al cargar venta: " + error.message);
  }
}

// Función para actualizar una venta
async function actualizarVenta(id, ventaData) {
  try {
    const ventaRef = doc(db, "venta", id);
    
    // Convertir el precio de string a número
    ventaData.precio = parseFloat(ventaData.precio);
    
    // Añadir fecha de actualización
    ventaData.fechaActualizacion = new Date();
    
    // Actualizar el documento en Firestore
    await updateDoc(ventaRef, ventaData);
    
    console.log("Venta actualizada con ID:", id);
    
    // Recargar la tabla de ventas
    cargarVentas();
    
    // Mostrar mensaje de éxito
    alert("¡Venta actualizada correctamente!");
    
    // Restablecer el formulario al estado de agregar
    resetearFormulario();
    
    return true;
  } catch (error) {
    console.error("Error al actualizar venta:", error);
    alert("Error al actualizar venta: " + error.message);
    return false;
  }
}

// Función para agregar una nueva venta a Firestore
async function agregarVenta(ventaData) {
  try {
    const ventasRef = collection(db, "venta");
    
    // Convertir el precio de string a número
    ventaData.precio = parseFloat(ventaData.precio);
    
    // Convertir la fecha a objeto Date si es un string
    if (typeof ventaData.fecha === 'string') {
      ventaData.fecha = new Date(ventaData.fecha);
    }
    
    // Añadir el documento a Firestore
    const docRef = await addDoc(ventasRef, ventaData);
    
    console.log("Venta agregada con ID:", docRef.id);
    
    // Recargar la tabla de ventas
    cargarVentas();
    
    // Mostrar mensaje de éxito
    alert("¡Venta registrada correctamente!");
    
    return true;
  } catch (error) {
    console.error("Error al agregar venta:", error);
    alert("Error al agregar venta: " + error.message);
    return false;
  }
}

// Función para eliminar una venta
async function eliminarVenta(id) {
  try {
    await deleteDoc(doc(db, "venta", id));
    console.log("Venta eliminada:", id);
    
    // Recargar la tabla
    cargarVentas();
    
    alert("Venta eliminada correctamente");
  } catch (error) {
    console.error("Error al eliminar venta:", error);
    alert("Error al eliminar venta: " + error.message);
  }
}

// Función para resetear el formulario al estado de agregar
function resetearFormulario() {
  const form = document.getElementById('venta-form');
  if (form) {
    form.reset();
    
    // Establecer la fecha de hoy por defecto
    const fechaHoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = fechaHoy;
    
    // Cambiar el título del formulario
    const formTitle = document.getElementById('form-title');
    if (formTitle) {
      formTitle.textContent = 'Registrar Nueva Venta';
    }
    
    // Cambiar el texto del botón a "Guardar"
    const submitButton = document.querySelector('#venta-form button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = 'Guardar Venta';
    }
    
    // Actualizar estado de la aplicación
    currentVentaId = null;
    isEditing = false;
    
    // Restablecer texto del botón Limpiar
    const resetButton = document.querySelector('#venta-form button[type="reset"]');
    if (resetButton) {
      resetButton.textContent = 'Limpiar';
    }
    
    // Quitar resaltado de edición
    document.querySelector('.form-container').classList.remove('editing');
  }
}

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Si hay un usuario autenticado, cargar los datos
  if (currentUser) {
    cargarVentas();
    
    // Establecer la fecha de hoy por defecto en el formulario
    const fechaHoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = fechaHoy;
    
    // Configurar el evento submit del formulario
    const ventaForm = document.getElementById('venta-form');
    if (ventaForm) {
      ventaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Recoger los datos del formulario
        const ventaData = {
          cliente: document.getElementById('cliente').value,
          fecha: document.getElementById('fecha').value,
          producto: document.getElementById('producto').value,
          precio: document.getElementById('precio').value,
          estado: document.getElementById('estado').value
        };
        
        let success = false;
        
        // Verificar si estamos editando o agregando
        if (isEditing && currentVentaId) {
          // Actualizar venta existente
          success = await actualizarVenta(currentVentaId, ventaData);
        } else {
          // Agregar nueva venta
          ventaData.fechaCreacion = new Date();
          success = await agregarVenta(ventaData);
        }
        
        // Si fue exitoso, limpiar el formulario
        if (success) {
          resetearFormulario();
        }
      });
      
      // Configurar el evento reset del formulario
      ventaForm.addEventListener('reset', () => {
        // Si estamos en modo edición, cancelar la edición
        if (isEditing) {
          resetearFormulario();
        }
      });
    }
  }
});