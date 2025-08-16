const URL_BASE = "https://goalify.develotion.com/";
const MENU = document.querySelector("#menu");
const ROUTER = document.querySelector("#ruteo");
const HOME = document.querySelector("#pantalla-home");
const LOGIN = document.querySelector("#pantalla-login");
const REGISTRO = document.querySelector("#pantalla-registro");
const INFORME = document.querySelector("#pantalla-informe");
const MAPA = document.querySelector("#pantalla-mapa");
const VER_EVALUACIONES = document.querySelector("#pantalla-ver-evaluaciones");
const VER_AGREGAR_EVALUACIONES = document.querySelector("#pantalla-agregar-evaluaciones");
const NAV = document.querySelector("#nav")

//
let loading = document.createElement('ion-loading');
const hoy = new Date().toISOString().split("T")[0];
let map = null;
inicio();

function inicio() {
    ROUTER.addEventListener("ionRouteDidChange", navegar);
    document.querySelector("#logout").addEventListener("click", logout)
    document.querySelector("#btnLogin").addEventListener("click", login);
    document.querySelector("#btnRegistrar").addEventListener("click", registrar);
    document.querySelector("#btnAgregarEval").addEventListener("click", agregarEvaluacion);
    armarMenu()
}
//NAVIGATE
function navegar(event) { //RUTEO
    let ruta = event.detail.to;
    ocultarPantallas();
    MENU.close()
    switch (ruta) {
        case "/":
            HOME.style.display = "block";
            break;
        case "/login":
            LOGIN.style.display = "block";
            break;
        case "/registro":
            cargarSelectPaises();
            REGISTRO.style.display = "block";
            break;
        case "/ver-evaluaciones":
            mostrarEvaluaciones();
            VER_EVALUACIONES.style.display = "block";
            break;
        case "/agregar-evaluaciones":
            cargarSelectObjetivos(obtenerObjetivos());
            VER_AGREGAR_EVALUACIONES.style.display = "block";
            break;
        case "/informe":
            informe();
            INFORME.style.display = "block";
            break;
        case "/mapa":
            setTimeout(function () { crearMapa() }, 500)
            MAPA.style.display = "block";
            break;
    }
}
function ocultarPantallas() { //OCULTAR PANTALLAS
    HOME.style.display = "none";
    LOGIN.style.display = "none";
    REGISTRO.style.display = "none";
    VER_EVALUACIONES.style.display = "none";
    VER_AGREGAR_EVALUACIONES.style.display = "none";
    INFORME.style.display = "none";
    MAPA.style.display = "none";
}

//EVALUACIONES
async function agregarEvaluacion() { //AGREGAR
    let objetivo = document.querySelector("#selectObjetivos").value;
    let fechaEvaluacion = document.querySelector("#datetime").value;
    let calificacionEvaluacion = document.querySelector("#calificacion").value;

    let token = localStorage.getItem("token")
    let id = localStorage.getItem("idUser")


    const myHeaders = new Headers();

    if (fechaEvaluacion > hoy || !camposValidos(objetivo)) {
        Alertar("Error", "Verifique sus datos", "Campos vacíos o fechas superiores a hoy no son correctos.")
    } else {
        //VALIDAR FECHA
        let datos = {
            idObjetivo: objetivo,
            idUsuario: id,
            calificacion: calificacionEvaluacion,
            fecha: fechaEvaluacion
        }
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("token", token);
        myHeaders.append("idUser", id)
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(datos),
            redirect: "follow"
        };

        PrenderLoading("Creando evaluacion...");

        let response = await fetch(URL_BASE + "/evaluaciones.php", requestOptions);
        if (response.status == 401) {
            MostrarToast("ERROR DE SESIÓN, Por favor loguee denuevo", 2000)
            logout();
        }
        let body = await response.json();

        ApagarLoading();

        if (body.codigo != 200) {
            Alertar("ERORR", "Error al crear la evaluación", body.mensaje)
        } else {
            MostrarToast("Creacion exitosa", 3000);
            document.querySelector("#datetime").value = "2025-01-01";
            document.querySelector("#calificacion").value = "0";
        }
    }
}
async function mostrarEvaluaciones() {//LISTAR
    PrenderLoading("Cargando datos...");
    let objetivos = await obtenerObjetivos();
    let evaluaciones = await obtenerEvaluaciones();
    let datos = obtenerFichaEvaluacion(objetivos.objetivos, evaluaciones.evaluaciones)
    let texto = ``;

    for (let obj of datos) {

        texto += `<ion-card>
                       
                        <ion-card-header>
                            <ion-card-title> ${obj.nombre + obj.emoji}</ion-card-title>
                            
                            <ion-card-subtitle>${obj.fecha}</ion-card-subtitle>
                        </ion-card-header>
                        
                        <ion-card-content>
                        CALIFICACION: ${obj.calificacion}
                        <ion-button onclick="eliminarEvaluacion('${obj.id}')">Eliminar</ion-button>
                        </ion-card-content>
                    </ion-card>`
    }
    document.querySelector("#listaEvaluaciones").innerHTML = texto;
    ApagarLoading();
}
async function eliminarEvaluacion(idEvaluacion) { //ELIMINAR
    const myHeaders = new Headers();
    let token = localStorage.getItem("token")
    let id = localStorage.getItem("idUser")

    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("token", token);
    myHeaders.append("idUser", id)
    const requestOptions = {
        method: "DELETE",
        headers: myHeaders,
        redirect: "follow"
    };
    PrenderLoading("Eliminando evaluación...");
    let response = await fetch(URL_BASE + "evaluaciones.php?idEvaluacion=" + idEvaluacion, requestOptions);
    if (response.status == 401) {
        MostrarToast("ERROR DE SESIÓN, Por favor loguee denuevo", 2000)
        ApagarLoading();
        logout();
    }
    let data = await response.json();
    mostrarEvaluaciones()
    ApagarLoading();
    MostrarToast("Evaluación eliminada con éxito", 2000)

    return data;

}
async function filtrarPorFecha(dias) { //FILTRAR EVALUACIONES
    PrenderLoading("Cargando datos...");

    let fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    const desde = fecha.toISOString().split("T")[0];

    let evaluaciones = await obtenerEvaluaciones();
    let objetivo = await obtenerObjetivos();

    const filtradas = evaluaciones.evaluaciones.filter(e => e.fecha >= desde && e.fecha <= hoy);

    let datos = obtenerFichaEvaluacion(objetivo.objetivos, filtradas);
    let texto = ``;

    for (let obj of datos) {

        texto += `<ion-card>
                    
                    <ion-card-header>
                        <ion-card-title> ${obj.nombre + obj.emoji}</ion-card-title>
                        
                        <ion-card-subtitle>${obj.fecha}</ion-card-subtitle>
                    </ion-card-header>
                    
                    <ion-card-content>
                    CALIFICACION: ${obj.calificacion}
                    <ion-button onclick="eliminarEvaluacion('${obj.id}')">Eliminar</ion-button>
                    </ion-card-content>
                </ion-card>`
    }
    document.querySelector("#listaEvaluaciones").innerHTML = texto;
    ApagarLoading();
}
//MAPA
async function crearMapa() {// CREAR MAPA
    PrenderLoading("Cargando mapa...")
    try {
        let latitud = -17.259307
        let longitud = -59.229986

        let paises = await obtenerPaises() //.paises = latitude: -34, longitude: -64;
        let usuarios = await obtenerUsuariosPorPais();
        let cantidadUsuarios = obtenerUsuarios(paises.paises, usuarios.paises)
        if (map != null) {
            map.remove();
        }
        var map = L.map('map').setView([latitud, longitud], 3);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        for (const dato of cantidadUsuarios) {
            var marker = L.marker([dato.latitud, dato.longitud]).addTo(map);
            marker.bindPopup("<b>" + dato.nombre + "</b><br>Usuarios: " + dato.cantidad).openPopup();
        }
        MostrarToast("Mapa cargado con éxito", 1500)
    }
    catch (error) {
        console.log("An error occurred:", error.message);
    }
    ApagarLoading()


}
//INFORME
async function informe() {
    PrenderLoading("Cargando datos...");
    let objetivos = await obtenerObjetivos();
    let evaluaciones = await obtenerEvaluaciones();
    let datos = obtenerFichaEvaluacion(objetivos.objetivos, evaluaciones.evaluaciones)
    let promedios = obtenerPromedios(datos)
    let texto = ``;

    if (promedios) {
        texto += `<ion-item lines="none">
                        <ion-label>
                            <h2 style="color: #0b56d2; font-weight: bold;">Puntaje Global</h2>
                            <p style="font-weight: bold;">${promedios[0].global}</p>
                        </ion-label>
                        <ion-label>
                           <h2 style="color: #1a8a31; font-weight: bold;">Puntaje Diario</h2>
                            <p style="font-weight: bold;">${promedios[0].daily}</p>
                        </ion-label>
                    </ion-item>`
    }
    document.querySelector("#listaPromedio").innerHTML = texto;
    ApagarLoading();
}
function obtenerPromedios(evaluaciones) {
    const datos = []
    let totalDaily = 0
    let totalGlobal = 0
    if (evaluaciones) {
        const filtradas = evaluaciones.filter(e => e.fecha == hoy);
        for (let evaluacion of evaluaciones) {
            totalGlobal += evaluacion.calificacion
        }
        for (let filtrada of filtradas) {
            totalDaily += filtrada.calificacion
        }
        totalDaily = filtradas.length ? totalDaily / filtradas.length : 0;
        totalGlobal = evaluaciones.length ? totalGlobal / evaluaciones.length : 0;
    }
    else {
        totalDaily = 0;
        totalGlobal = 0;
    }
    datos.push({
        global: totalGlobal,
        daily: totalDaily
    });

    return datos;
}
//LLAMADOS / GETS de la api
async function obtenerPaises() { // ME TRAIGO LOS PAISES
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };
    let response = await fetch(URL_BASE + "paises.php", requestOptions);
    if (response.status == 401) {
        MostrarToast("ERROR DE SESIÓN, Por favor loguee denuevo", 2000)
        ApagarLoading();
        logout();
    }
    let data = await response.json();

    return data;
}
async function obtenerUsuariosPorPais() {// ME TRAIGO LOS USERS
    let token = localStorage.getItem("token")
    let id = localStorage.getItem("idUser")

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("token", token);
    myHeaders.append("idUser", id)

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };
    let response = await fetch(URL_BASE + "usuariosPorPais.php", requestOptions);
    if (response.status == 401) {
        MostrarToast("ERROR DE SESIÓN, Por favor loguee denuevo", 2000)
        ApagarLoading();
        logout();
    }
    let data = await response.json();

    return data;
}
function obtenerUsuarios(paises, usuariosPaises) {//USUARIO X PAIS
    const datos = [];

    for (let usuarioPais of usuariosPaises) {
        for (let pais of paises) {
            if (usuarioPais.nombre === pais.name) {
                datos.push({
                    nombre: pais.name,
                    latitud: pais.latitude,
                    longitud: pais.longitude,
                    cantidad: usuarioPais.cantidadDeUsuarios
                });
                break;
            }
        }
    }

    return datos;
}
async function obtenerObjetivos() { //OBJETIVOS
    const myHeaders = new Headers();
    let token = localStorage.getItem("token")
    let id = localStorage.getItem("idUser")
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("token", token);
    myHeaders.append("idUser", id)
    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };
    let response = await fetch(URL_BASE + "objetivos.php", requestOptions);
    if (response.status == 401) {
        MostrarToast("ERROR DE SESIÓN, Por favor loguee denuevo", 2000)
        ApagarLoading();
        logout();
    }
    let data = await response.json();

    return data;

}
async function obtenerEvaluaciones() { //EVALUACIONES
    const myHeaders = new Headers();
    let token = localStorage.getItem("token")
    let id = localStorage.getItem("idUser")
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("token", token);
    myHeaders.append("idUser", id)
    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };
    let response = await fetch(URL_BASE + "evaluaciones.php?idUsuario=" + id, requestOptions);
    if (response.status == 401) {
        MostrarToast("ERROR DE SESIÓN, Por favor loguee denuevo", 2000)
        ApagarLoading();
        logout();
    }

    let data = await response.json();

    //console.log(data)
    return data;

}
function obtenerFichaEvaluacion(objetivos, evaluaciones) {
    const datos = [];

    for (let evaluacion of evaluaciones) {
        for (let objetivo of objetivos) {
            if (evaluacion.idObjetivo === objetivo.id) {
                datos.push({
                    id: evaluacion.id,
                    nombre: objetivo.nombre,
                    emoji: objetivo.emoji,
                    calificacion: evaluacion.calificacion,
                    fecha: evaluacion.fecha
                });
                break;
            }
        }
    }

    return datos;
}

//SELECTS
async function cargarSelectPaises() { //paises
    let select = document.querySelector("#selectPais")
    let data = await obtenerPaises();
    select.innerHTML = ""; // lo vacìo
    let optionsHTML = "";
    data.paises.forEach(pais => {
        optionsHTML += "<ion-select-option value=" + pais.id + ">" + pais.name + "</ion-select-option>"; //VALUE guarda el ID a usar en el registro
    });
    select.innerHTML = optionsHTML;

    //console.log(data);

}
async function cargarSelectObjetivos() {//objetivos
    const select = document.querySelector("#selectObjetivos");
    const data = await obtenerObjetivos();
    select.innerHTML = ""; // lo vacìo
    let optionsHTML = "";
    data.objetivos.forEach(objetivo => {
        optionsHTML += "<ion-select-option value=" + objetivo.id + ">" + objetivo.nombre + " - " + objetivo.emoji + "</ion-select-option>"; //VALUE guarda el ID a usar en el registro
    });
    select.innerHTML = optionsHTML;

}

//REGISTRO
async function login() {
    let email = document.querySelector("#emailLogin").value
    let password = document.querySelector("#passwordLogin").value

    if (!camposValidos(email, password)) {
        Alertar("Error", "Verifique sus credenciales e intente nuevamente", "")
    } else {
        let obj = {};
        obj.usuario = email.toLowerCase();
        obj.password = password;

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const rawBody = JSON.stringify(obj);
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: rawBody,
            redirect: "follow"
        };
        PrenderLoading("Realizando login...");
        let response = await fetch(URL_BASE + "/login.php", requestOptions);
        if (response.status == 401) {
            MostrarToast("ERROR DE SESIÓN, Por favor loguee denuevo", 2000)
            ApagarLoading();
            logout();
        }
        
        //console.log(response);
        let body = await response.json();
        //console.log(body);
        ApagarLoading();
        if (body.codigo != 200) {
            Alertar("ERORR", "Error al realizar el login", body.mensaje)
        } else {
            MostrarToast("Login exitoso", 3000);
            localStorage.setItem("token", body.token)
            localStorage.setItem("idUser", body.id)
            armarMenu()
            mostrarEvaluaciones()
            NAV.push("page-ver-evaluaciones")
            document.querySelector("#emailLogin").value = ""
            document.querySelector("#passwordLogin").value = ""
        }

    }
}
async function registrar() {
    let usuario = document.querySelector("#email").value.toLowerCase() //Paso el mail pero la api lo toma como usuario
    let password = document.querySelector("#password").value
    let idPais = document.querySelector("#selectPais").value // el select guarda los ids.

    if (!camposValidos(usuario, password, idPais)) {
        Alertar("Error", "", "Todos los campos son obligatorios"); //Alertar(titulo, subtitulo, mensaje) {
    } else {
        let objUsuario = new Usuario(usuario, password, idPais);
        //console.log(objUsuario)
        // console.log(JSON.stringify(objUsuario))

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const rawBody = JSON.stringify(objUsuario);
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: rawBody,
            redirect: "follow"
        };
        PrenderLoading("Realizando registro")
        let response = await fetch("https://goalify.develotion.com/usuarios.php", requestOptions);
        if (response.status == 401) {
            MostrarToast("ERROR DE SESIÓN, Por favor loguee denuevo", 2000)
            ApagarLoading();
            logout();
        }
        //console.log(response);
        let body = await response.json();
        ApagarLoading()
        //console.log(body);
        if (body.codigo != 200) {
            Alertar("Error", "Error al registrarse", body.mensaje)
        } else {
            MostrarToast("Registro con exito", 3000);
        }
        document.addEventListener("DOMContentLoaded", () => {
            const boton = document.querySelector("#btnRegistrar");
            if (boton) {
                boton.addEventListener("click", registrar);
            }
        });
    }

}

//VALIDATE DE CAMPOS               
function camposValidos(...datos) {
    for (let dato of datos) {
        if (dato == null || dato == "" || dato == undefined) {
            return false;
        }
    }
    return true;
}

//AVISOS AL USUARIO
function PrenderLoading(texto) {
    document.body.appendChild(loading);
    loading.cssClass = 'my-custom-class';
    loading.message = texto;
    //loading.duration = 3000;
    loading.present();
}
function ApagarLoading() {
    loading.dismiss();

}
function Alertar(titulo, subtitulo, mensaje) {
    const alert = document.createElement('ion-alert');
    document.body.appendChild(alert);
    alert.cssClass = 'my-custom-class';
    alert.header = titulo;
    alert.subHeader = subtitulo;
    alert.message = mensaje;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    alert.present();
}
function MostrarToast(mensaje, duracion) {
    const toast = document.createElement('ion-toast');
    toast.message = mensaje;
    toast.duration = duracion;
    document.body.appendChild(toast);
    toast.present();
}

//LOGOUT
function logout() {
    localStorage.removeItem("token")
    MENU.close();
    armarMenu();
    NAV.push("page-home")
}

//ARMAR MENU
function armarMenu() {
    let elemsClaseDeslogueado = document.querySelectorAll(".deslogueado")
    let elemsClaseLogueado = document.querySelectorAll(".logueado")
    for (let elem of elemsClaseDeslogueado) {
        elem.style.display = "none"
    }
    for (let elem of elemsClaseLogueado) {
        elem.style.display = "none"
    }
    let estoyLogueado = localStorage.getItem("token") != null
    //console.log(estoyLogueado)
    if (estoyLogueado) {

        for (let elem of elemsClaseLogueado) {
            elem.style.display = "block"
        }
    } else {
        for (let elem of elemsClaseDeslogueado) {
            elem.style.display = "block"
        }
    }
}