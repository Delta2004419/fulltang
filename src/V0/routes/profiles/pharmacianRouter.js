const express = require('express')
const router = express.Router()
const Personnel = require('../../models/Personnel')
const Examen = require('../../models/Examen')
const Resultat = require('../../models/Resultat')
const Medicament = require('../../models/Medicament')
const Prescription = require('../../models/Prescription')
const { Op } = require('sequelize')


router.use(express.json())

router.use((req,res,next)=>{
    if(req.session.user.specialite!="pharmacian"){ 
        if(["cashier","receptionnist","labtechnician"].includes(req.session.user.specialite)){ 
            res.redirect("/fulltang/V0/"+req.session.user.specialite)
          }else{
              res.redirect("/fulltang/V0/doctor")
          }  
            
    }else{
        next()
    }
})

.get('/',  async (req, res)=>{
    const medicaments = await Medicament.findAll({order: [["id","DESC"]] })
    const number = medicaments.length
    let nomsMedicaments = [];
    for (let i = 0; i < medicaments.length; i++) {
      nomsMedicaments.push(medicaments[i].nom);
    }
    console.log(nomsMedicaments)
    res.render("pharmacian/dashboard",{ medicaments: medicaments, number: number, nomsMedicaments: nomsMedicaments})    
})

.get('/dashboard',  async (req, res)=>{
    const medicaments = await Medicament.findAll({order: [["id","DESC"]] })
    const number = medicaments.length
    let nomsMedicaments = [];
    for (let i = 0; i < medicaments.length; i++) {
      nomsMedicaments.push(medicaments[i].nom);
    }
    res.render("pharmacian/dashboard",{ medicaments: medicaments, number: number, nomsMedicaments: nomsMedicaments})    
})

.get('/medicament-list',  async (req, res)=>{
    const list = await Medicament.findAll({order: [["id","DESC"]] })
    res.render("pharmacian/medicament-list",{ medicaments: list})    
})

.post("/medicament-list", async (req, res) => {
    try {
        const { items } = req.body;

        // Parcourir les éléments du panier et mettre à jour les quantités des médicaments
        for (const { nom, quantite } of items) {
            const medicament = await Medicament.findOne({ where: { nom } });
            if (medicament) {
                console.log(medicament.nombre)
                await medicament.update({ nombre: medicament.nombre - quantite });
                console.log(medicament.nombre)
            } else {
                // Le médicament n'a pas été trouvé, peut-être renvoyer une erreur ici
                console.error(`Médicament non trouvé : ${nom}`);
            }
        }

        // Renvoyer une réponse de succès
        res.status(200).json({ message: "Commande passée avec succès" });
    } catch (error) {
        console.error("Erreur lors de la commande :", error);
        res.status(500).json({ message: "Erreur lors de la commande" });
    }
});


module.exports = router