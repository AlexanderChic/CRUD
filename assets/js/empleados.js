// empleados.js
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
let currentEmpleadoId = null;
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
  
  // Cargar datos de empleados
  cargarEmpleados();
  
} else {
  // No hay usuario autenticado, redirigir al login
  console.log("No hay sesión activa");
  window.location.href = "index.html"; // Redirigir al login
}

// Función para cargar los empleados desde Firestore
async function cargarEmpleados() {
  try {
    const empleadosTabla = document.getElementById('empleados-tabla');
    if (!empleadosTabla) return;
    
    const empleadosRef = collection(db, "empleados");
    const empleadosSnapshot = await getDocs(empleadosRef);
    
    // Limpiar tabla actual
    empleadosTabla.innerHTML = '';
    
    if (empleadosSnapshot.empty) {
      empleadosTabla.innerHTML = `
        <tr>
          <td colspan="7" class="no-data">No hay empleados registrados</td>
        </tr>
      `;
      return;
    }
    
   // Agregar filas con datos de empleados
empleadosSnapshot.forEach((doc) => {
  const empleado = doc.data();
  const empleadoId = doc.id;
  
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${empleadoId.substring(0, 6)}...</td>
    <td>${empleado.nombre || 'N/A'}</td>
    <td>${empleado.correo || 'N/A'}</td>
    <td>${empleado.puesto || 'N/A'}</td>
    <td>Q${empleado.sueldo ? empleado.sueldo.toFixed(2) : '0.00'}</td>
    <td>${empleado.carnet || 'N/A'}</td>
    <td>${empleado.user || 'N/A'}</td>
    <td>
  <div class="password-wrapper">
    <input type="password" value="${empleado.password || ''}" readonly class="password-input">
    <button class="toggle-password" title="Mostrar/Ocultar contraseña">
      <i class="fas fa-eye"></i>
    </button>
  </div>
</td>
    <td class="acciones">
      <button class="btn-editar" data-id="${empleadoId}" title="Editar Empleado"><i class="fas fa-edit"></i></button>
      <button class="btn-eliminar" data-id="${empleadoId}" title="Eliminar Empleado"><i class="fas fa-trash-alt"></i></button>
    </td>
  `;
  
  empleadosTabla.appendChild(row);
});

    
    // Añadir event listeners para los botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
          eliminarEmpleado(id);
        }
      });
    });
    
    // Añadir event listeners para los botones de editar
    document.querySelectorAll('.btn-editar').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        cargarEmpleadoParaEditar(id);
      });
    });
    
    console.log("Empleados cargados:", empleadosSnapshot.size); // Para depuración
    
  } catch (error) {
    console.error("Error al cargar empleados:", error);
    
    const empleadosTabla = document.getElementById('empleados-tabla');
    if (empleadosTabla) {
      empleadosTabla.innerHTML = `
        <tr>
          <td colspan="7" class="error-row">Error al cargar datos: ${error.message}</td>
        </tr>
      `;
    }
  }
}

// Función para cargar un empleado para editar
async function cargarEmpleadoParaEditar(id) {
  try {
    const empleadoDoc = await getDoc(doc(db, "empleados", id));
    
    if (empleadoDoc.exists()) {
      const empleado = empleadoDoc.data();
      
      // Actualizar el formulario con los datos del empleado
      document.getElementById('nombre').value = empleado.nombre || '';
      document.getElementById('correo').value = empleado.correo || '';
      document.getElementById('puesto').value = empleado.puesto || '';
      document.getElementById('sueldo').value = empleado.sueldo || '';
      document.getElementById('carnet').value = empleado.carnet || '';
      document.getElementById('user').value = empleado.user || '';
      document.getElementById('password').value = empleado.password || '';
      
      // Actualizar estado de la aplicación
      currentEmpleadoId = id;
      isEditing = true;
      
      // Cambiar el texto del botón a "Actualizar"
      const submitButton = document.querySelector('#empleado-form button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = 'Actualizar Empleado';
      }
      
      // Mostrar botón para cancelar edición
      const cancelButton = document.querySelector('#empleado-form button[type="reset"]');
      if (cancelButton) {
        cancelButton.textContent = 'Cancelar';
        cancelButton.style.display = 'inline-block';
      }
      
      // Scroll hacia el formulario
      document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    } else {
      console.error("No se encontró el empleado");
      alert("No se encontró el empleado solicitado");
    }
  } catch (error) {
    console.error("Error al cargar empleado para editar:", error);
    alert("Error al cargar empleado: " + error.message);
  }
}

// Función para actualizar un empleado
async function actualizarEmpleado(id, empleadoData) {
  try {
    const empleadoRef = doc(db, "empleados", id);
    
    // Convertir el sueldo de string a número
    empleadoData.sueldo = parseFloat(empleadoData.sueldo);
    
    // Añadir fecha de actualización
    empleadoData.fechaActualizacion = new Date();
    
    // Actualizar el documento en Firestore
    await updateDoc(empleadoRef, empleadoData);
    
    console.log("Empleado actualizado con ID:", id);
    
    // Recargar la tabla de empleados
    cargarEmpleados();
    
    // Mostrar mensaje de éxito
    alert("¡Empleado actualizado correctamente!");
    
    // Restablecer el formulario al estado de agregar
    resetearFormulario();
    
    return true;
  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    alert("Error al actualizar empleado: " + error.message);
    return false;
  }
}

// Función para agregar un nuevo empleado a Firestore
async function agregarEmpleado(empleadoData) {
  try {
    const empleadosRef = collection(db, "empleados");
    // Convertir el sueldo de string a número
    empleadoData.sueldo = parseFloat(empleadoData.sueldo);
    
    // Añadir el documento a Firestore
    const docRef = await addDoc(empleadosRef, empleadoData);
    
    console.log("Empleado agregado con ID:", docRef.id);
    
    // Recargar la tabla de empleados
    cargarEmpleados();
    
    // Mostrar mensaje de éxito
    alert("¡Empleado agregado correctamente!");
    
    return true;
  } catch (error) {
    console.error("Error al agregar empleado:", error);
    alert("Error al agregar empleado: " + error.message);
    return false;
  }
}

// Función para eliminar un empleado
async function eliminarEmpleado(id) {
  try {
    await deleteDoc(doc(db, "empleados", id));
    console.log("Empleado eliminado:", id);
    
    // Recargar la tabla
    cargarEmpleados();
    
    alert("Empleado eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    alert("Error al eliminar empleado: " + error.message);
  }
}

// Función para resetear el formulario al estado de agregar
function resetearFormulario() {
  const form = document.getElementById('empleado-form');
  if (form) {
    form.reset();
    
    // Cambiar el texto del botón a "Guardar"
    const submitButton = document.querySelector('#empleado-form button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = 'Guardar Empleado';
    }
    
    // Actualizar estado de la aplicación
    currentEmpleadoId = null;
    isEditing = false;
    
    // Restablecer texto del botón Limpiar
    const resetButton = document.querySelector('#empleado-form button[type="reset"]');
    if (resetButton) {
      resetButton.textContent = 'Limpiar';
    }
  }
}

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Si hay un usuario autenticado, cargar los datos
  if (currentUser) {
    cargarEmpleados();
    
    // Configurar el evento submit del formulario
    const empleadoForm = document.getElementById('empleado-form');
    if (empleadoForm) {
      empleadoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Recoger los datos del formulario
        const empleadoData = {
          nombre: document.getElementById('nombre').value,
          correo: document.getElementById('correo').value,
          puesto: document.getElementById('puesto').value,
          sueldo: document.getElementById('sueldo').value,
          carnet: document.getElementById('carnet').value,
          user: document.getElementById('user').value,
          password: document.getElementById('password').value
        };
        
        let success = false;
        
        // Verificar si estamos editando o agregando
        if (isEditing && currentEmpleadoId) {
          // Actualizar empleado existente
          success = await actualizarEmpleado(currentEmpleadoId, empleadoData);
        } else {
          // Agregar nuevo empleado
          empleadoData.fechaCreacion = new Date();
          success = await agregarEmpleado(empleadoData);
        }
        
        // Si fue exitoso, limpiar el formulario
        if (success) {
          resetearFormulario();
        }
      });
      
      // Configurar el evento reset del formulario
      empleadoForm.addEventListener('reset', () => {
        // Si estamos en modo edición, cancelar la edición
        if (isEditing) {
          resetearFormulario();
        }
      });
    }
  }
});


document.addEventListener('click', function(e) {
  const btn = e.target.closest('.toggle-password');
  if (btn) {
    const input = btn.parentElement.querySelector('input');
    const icon = btn.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
});
