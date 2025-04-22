// producto.js
// Importar Firebase
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

// Configuración Firebase - Usa la misma configuración que tenías en ventas.js
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
let currentProductoId = null;
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
  
  // Cargar datos de productos
  cargarProductos();
  
} else {
  // No hay usuario autenticado, redirigir al login
  console.log("No hay sesión activa");
  window.location.href = "index.html"; // Redirigir al login
}

// Función para cargar los productos desde Firestore
async function cargarProductos() {
  try {
    const productosTabla = document.getElementById('productos-tabla');
    if (!productosTabla) return;
    
    const productosRef = collection(db, "productos");
    const productosSnapshot = await getDocs(productosRef);
    
    // Limpiar tabla actual
    productosTabla.innerHTML = '';
    
    if (productosSnapshot.empty) {
      productosTabla.innerHTML = `
        <tr>
          <td colspan="7" class="no-data">No hay productos registrados</td>
        </tr>
      `;
      return;
    }
    
    // Agregar filas con datos de productos
    productosSnapshot.forEach((doc) => {
      const producto = doc.data();
      const productoId = doc.id;
      
      const row = document.createElement('tr');
      
      // Aplicar clase según el estado
      if (producto.estado === 'Agotado') {
        row.classList.add('estado-agotado');
      } else if (producto.estado === 'Descontinuado') {
        row.classList.add('estado-descontinuado');
      }
      
      row.innerHTML = `
        <td>${productoId.substring(0, 6)}...</td>
        <td>${producto.producto || 'N/A'}</td>
        <td>${producto.descripcion || 'N/A'}</td>
        <td>${producto.categoria || 'N/A'}</td>
        <td>Q${producto.precio ? producto.precio.toFixed(2) : '0.00'}</td>
        <td>${producto.Stock || '0'}</td>
        <td><span class="estado-badge estado-${producto.estado?.toLowerCase() || 'disponible'}">${producto.estado || 'Disponible'}</span></td>
        <td class="acciones">
          <button class="btn-editar" data-id="${productoId}"><i class="fas fa-edit"></i></button>
          <button class="btn-eliminar" data-id="${productoId}"><i class="fas fa-trash-alt"></i></button>
        </td>
      `;
      
      productosTabla.appendChild(row);
    });
    
    // Añadir event listeners para los botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
          eliminarProducto(id);
        }
      });
    });
    
    // Añadir event listeners para los botones de editar
    document.querySelectorAll('.btn-editar').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        cargarProductoParaEditar(id);
      });
    });
    
    console.log("Productos cargados:", productosSnapshot.size); // Para depuración
    
  } catch (error) {
    console.error("Error al cargar productos:", error);
    
    const productosTabla = document.getElementById('productos-tabla');
    if (productosTabla) {
      productosTabla.innerHTML = `
        <tr>
          <td colspan="7" class="error-row">Error al cargar datos: ${error.message}</td>
        </tr>
      `;
    }
  }
}

// Función para cargar un producto para editar
async function cargarProductoParaEditar(id) {
  try {
    const productoDoc = await getDoc(doc(db, "productos", id));
    
    if (productoDoc.exists()) {
      const producto = productoDoc.data();
      
      // Actualizar el formulario con los datos del producto
      document.getElementById('nombre').value = producto.producto || '';
      document.getElementById('descripcion').value = producto.descripcion || '';
      document.getElementById('categoria').value = producto.categoria || '';
      document.getElementById('precio').value = producto.precio || '';
      document.getElementById('stock').value = producto.Stock || '';
      document.getElementById('estado').value = producto.Estado || 'Disponible';
      
      // Actualizar estado de la aplicación
      currentProductoId = id;
      isEditing = true;
      
      // Cambiar el título del formulario
      const formTitle = document.getElementById('form-title');
      if (formTitle) {
        formTitle.textContent = 'Editar Producto';
      }
      
      // Cambiar el texto del botón a "Actualizar"
      const submitButton = document.querySelector('#producto-form button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = 'Actualizar Producto';
      }
      
      // Mostrar botón para cancelar edición
      const cancelButton = document.querySelector('#producto-form button[type="reset"]');
      if (cancelButton) {
        cancelButton.textContent = 'Cancelar';
      }
      
      // Resaltar el formulario para indicar edición
      document.querySelector('.form-container').classList.add('editing');
      
      // Scroll hacia el formulario
      document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    } else {
      console.error("No se encontró el producto");
      alert("No se encontró el producto solicitado");
    }
  } catch (error) {
    console.error("Error al cargar producto para editar:", error);
    alert("Error al cargar producto: " + error.message);
  }
}

// Función para actualizar un producto
async function actualizarProducto(id, productoData) {
  try {
    const productoRef = doc(db, "productos", id);
    
    // Convertir el precio y stock de string a número
    productoData.precio = parseFloat(productoData.precio);
    productoData.stock = parseInt(productoData.stock);
    
    // Añadir fecha de actualización
    productoData.fechaActualizacion = new Date();
    
    // Actualizar el documento en Firestore
    await updateDoc(productoRef, productoData);
    
    console.log("Producto actualizado con ID:", id);
    
    // Recargar la tabla de productos
    cargarProductos();
    
    // Mostrar mensaje de éxito
    alert("¡Producto actualizado correctamente!");
    
    // Restablecer el formulario al estado de agregar
    resetearFormulario();
    
    return true;
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    alert("Error al actualizar producto: " + error.message);
    return false;
  }
}

// Función para agregar un nuevo producto a Firestore
async function agregarProducto(productoData) {
  try {
    const productosRef = collection(db, "productos");
    
    // Convertir el precio y stock de string a número
    productoData.precio = parseFloat(productoData.precio);
    productoData.stock = parseInt(productoData.stock);
    
    // Añadir fecha de creación
    productoData.fechaCreacion = new Date();
    
    // Añadir el documento a Firestore
    const docRef = await addDoc(productosRef, productoData);
    
    console.log("Producto agregado con ID:", docRef.id);
    
    // Recargar la tabla de productos
    cargarProductos();
    
    // Mostrar mensaje de éxito
    alert("¡Producto registrado correctamente!");
    
    return true;
  } catch (error) {
    console.error("Error al agregar producto:", error);
    alert("Error al agregar producto: " + error.message);
    return false;
  }
}

// Función para eliminar un producto
async function eliminarProducto(id) {
  try {
    await deleteDoc(doc(db, "productos", id));
    console.log("Producto eliminado:", id);
    
    // Recargar la tabla
    cargarProductos();
    
    alert("Producto eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    alert("Error al eliminar producto: " + error.message);
  }
}

// Función para resetear el formulario al estado de agregar
function resetearFormulario() {
  const form = document.getElementById('producto-form');
  if (form) {
    form.reset();
    
    // Cambiar el título del formulario
    const formTitle = document.getElementById('form-title');
    if (formTitle) {
      formTitle.textContent = 'Registrar Nuevo Producto';
    }
    
    // Cambiar el texto del botón a "Guardar"
    const submitButton = document.querySelector('#producto-form button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = 'Guardar Producto';
    }
    
    // Actualizar estado de la aplicación
    currentProductoId = null;
    isEditing = false;
    
    // Restablecer texto del botón Limpiar
    const resetButton = document.querySelector('#producto-form button[type="reset"]');
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
    cargarProductos();
    
    // Configurar el evento submit del formulario
    const productoForm = document.getElementById('producto-form');
    if (productoForm) {
      productoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Recoger los datos del formulario
        const productoData = {
          producto: document.getElementById('nombre').value,
          descripcion: document.getElementById('descripcion').value,
          categoria: document.getElementById('categoria').value,
          precio: document.getElementById('precio').value,
          Stock: document.getElementById('stock').value,
          estado: document.getElementById('estado').value
        };
        
        let success = false;
        
        // Verificar si estamos editando o agregando
        if (isEditing && currentProductoId) {
          // Actualizar producto existente
          success = await actualizarProducto(currentProductoId, productoData);
        } else {
          // Agregar nuevo producto
          success = await agregarProducto(productoData);
        }
        
        // Si fue exitoso, limpiar el formulario
        if (success) {
          resetearFormulario();
        }
      });
      
      // Configurar el evento reset del formulario
      productoForm.addEventListener('reset', () => {
        // Si estamos en modo edición, cancelar la edición
        if (isEditing) {
          resetearFormulario();
        }
      });
    }
  }
});

// Agregar evento para alternar la barra lateral (opcional)
const menuToggle = document.querySelector('.menu-toggle');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('collapsed');
    document.querySelector('.main-content').classList.toggle('expanded');
  });
}