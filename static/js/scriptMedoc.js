const medicamentsContainer = document.querySelector(".medicaments");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const categoriesContainer = document.querySelector(".categories-container");
const panierContainer = document.querySelector(".panier-container");
const panierIcon = document.querySelector(".panier-icon");
const panierCount = document.querySelector(".panier-count");
const panierBody = document.getElementById("panier-body");
const panierTotalAmount = document.getElementById("panier-total-amount");
const panierCheckoutBtn = document.querySelector(".panier-checkout"); // Déclaration de la variable panierCheckoutBtn
const medicaments = '<%- JSON.stringify(medicaments) %>;'
console.log(medicaments)

let currentIndex = 0;
let currentCategory = "Tous";
const itemsPerPage = 4;
let panier = [];

function displayMedicaments() {
    medicamentsContainer.innerHTML = "";
    const medicamentsToDisplay = currentCategory === "Tous" ? medicaments : medicaments.filter(medicament => medicament.categorie === currentCategory);
    for (let i = currentIndex; i < currentIndex + itemsPerPage; i++) {
        if (i >= medicamentsToDisplay.length) break;
        const medicament = medicamentsToDisplay[i];
        const medicamentElement = createMedicamentElement(medicament);
        medicamentsContainer.appendChild(medicamentElement);
    }
    updateButtonVisibility();
}

function createMedicamentElement(medicament) {
    const medicamentElement = document.createElement("div");
    medicamentElement.classList.add("medicament");

    const imageElement = document.createElement("img");
    imageElement.src = medicament.image;
    imageElement.alt = medicament.nom;

    const nomElement = document.createElement("h3");
    nomElement.textContent = medicament.nom;

    const descriptionElement = document.createElement("p");
    descriptionElement.textContent = medicament.description;

    const prixElement = document.createElement("p");
    prixElement.classList.add("prix");
    prixElement.textContent = `${medicament.prix} €`;

    const boutonElement = document.createElement("button");
    boutonElement.textContent = "Ajouter au panier";
    boutonElement.addEventListener("click", () => {
        addToCart(medicament);
    });

    medicamentElement.appendChild(imageElement);
    medicamentElement.appendChild(nomElement);
    medicamentElement.appendChild(descriptionElement);
    medicamentElement.appendChild(prixElement);
    medicamentElement.appendChild(boutonElement);

    return medicamentElement;
}

function updateButtonVisibility() {
    const medicamentsToDisplay = currentCategory === "Tous" ? medicaments : medicaments.filter(medicament => medicament.categorie === currentCategory);
    prevBtn.style.visibility = currentIndex === 0 ? "hidden" : "visible";
    nextBtn.style.visibility = currentIndex + itemsPerPage >= medicamentsToDisplay.length ? "hidden" : "visible";
}

prevBtn.addEventListener("click", () => {
    currentIndex = Math.max(currentIndex - itemsPerPage, 0);
    displayMedicaments();
});

nextBtn.addEventListener("click", () => {
    const medicamentsToDisplay = currentCategory === "Tous" ? medicaments : medicaments.filter(medicament => medicament.categorie === currentCategory);
    currentIndex = Math.min(currentIndex + itemsPerPage, medicamentsToDisplay.length - itemsPerPage);
    displayMedicaments();
});

const categories = ["Tous", ...new Set(medicaments.map(medicament => medicament.categorie))];

categories.forEach(category => {
    const categoryBtn = document.createElement("button");
    categoryBtn.classList.add("category-btn");
    categoryBtn.textContent = category;
    categoryBtn.addEventListener("click", () => {
        currentCategory = category;
        document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
        categoryBtn.classList.add("active");
        currentIndex = 0;
        displayMedicaments();
    });
    categoriesContainer.appendChild(categoryBtn);
});

// Ajouter cette ligne pour afficher tous les médicaments par défaut
document.querySelector(".category-btn").classList.add("active");
displayMedicaments();

function addToCart(medicament) {
    const existingItem = panier.find(item => item.nom === medicament.nom);
    if (existingItem) {
        existingItem.quantite++;
        existingItem.total = existingItem.prix * existingItem.quantite;
    } else {
        panier.push({
            ...medicament,
            quantite: 1,
            total: medicament.prix
        });
    }
    updatePanierDisplay();
    updatePanierIcon();
}

function updatePanierDisplay() {
    panierBody.innerHTML = "";
    let totalAmount = 0;
    panier.forEach(item => {
        const row = document.createElement("tr");

        const nomCell = document.createElement("td");
        nomCell.textContent = item.nom;

        const prixCell = document.createElement("td");
        prixCell.textContent = `${item.prix} €`;

        const quantiteCell = document.createElement("td");
        const quantiteInput = document.createElement("input");
        quantiteInput.type = "number";
        quantiteInput.value = item.quantite;
        quantiteInput.min = "1";
        quantiteInput.addEventListener("change", () => {
            item.quantite = parseInt(quantiteInput.value);
            item.total = item.prix * item.quantite;
            updatePanierDisplay();
        });
        quantiteCell.appendChild(quantiteInput);

        const totalCell = document.createElement("td");
        totalCell.textContent = `${item.total} €`;

        const supprimerCell = document.createElement("td");
        const supprimerBtn = document.createElement("button");
        supprimerBtn.textContent = "Supprimer";
        supprimerBtn.addEventListener("click", () => {
            removeFromCart(item);
        });
        supprimerCell.appendChild(supprimerBtn);

        row.appendChild(nomCell);
row.appendChild(prixCell);
row.appendChild(quantiteCell);
row.appendChild(totalCell);
row.appendChild(supprimerCell);
panierBody.appendChild(row);

totalAmount += item.total;
});
panierTotalAmount.textContent = `Total : ${totalAmount.toFixed(2)} €`;
}

function removeFromCart(item) {
    const index = panier.indexOf(item);
    if (index !== -1) {
        panier.splice(index, 1);
        updatePanierDisplay();
        updatePanierIcon();
    }
}

document.querySelectorAll(".medicament button").forEach(btn => {
    btn.addEventListener("click", () => {
        const medicament = medicaments.find(m => m.nom === btn.previousElementSibling.textContent);
        addToCart(medicament);
    });
});

panierIcon.addEventListener("click", () => {
    panierContainer.style.display = panierContainer.style.display === "none" ? "block" : "none";
});

function updatePanierIcon() {
    panierCount.textContent = panier.length;
}

panierCheckoutBtn.addEventListener("click", () => {
    // Ajouter ici la logique de paiement
    console.log("Commande passée !");
});

const searchInput = document.querySelector(".search input");
// const medicamentsContainer = document.querySelector(".medicaments");

searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredMedicaments = medicaments.filter(medicament =>
        medicament.nom.toLowerCase().includes(searchTerm)
    );

    medicamentsContainer.innerHTML = "";
    filteredMedicaments.forEach(medicament => {
        const medicamentElement = createMedicamentElement(medicament);
        medicamentsContainer.appendChild(medicamentElement);
    });
});

