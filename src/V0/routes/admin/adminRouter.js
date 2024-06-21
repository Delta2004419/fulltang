const express = require('express')
const router = express.Router()
const Personnel = require('../../models/Personnel')
const Examen = require('../../models/Examen')
const Resultat = require('../../models/Resultat')
const Medicament = require('../../models/Medicament')
const Prescription = require('../../models/Prescription')
const Consultation = require('../../models/Consultation')
const Parametre = require('../../models/Parametres')
const Carnet = require('../../models/Carnet')
const moment = require('moment');
const { Op } = require('sequelize')
const Patient = require('../../models/Patient')
const { fn, col, literal } = require('sequelize');


router.use(express.json())

router.use((req,res,next)=>{
    if(req.session.user.specialite!="administrator"){ 
        if(["cashier","receptionnist","labtechnician"].includes(req.session.user.specialite)){ 
            res.redirect("/fulltang/V0/"+req.session.user.specialite)
          }else{
              res.redirect("/fulltang/V0/doctor")
          }  
            
    }else{
        next()
    }
})

// all administrator routes implemented here...

//dashboard
.get('/',  async (req, res)=>{
    const list = await Personnel.findAll({where:{specialite:{[Op.ne]:"administrator"} },order: [["id","DESC"]] })
    const listConsultation = await Consultation.findAll({include: [{model: Patient,required: true}, {model: Carnet,required: true, attributes:["observation","diagnostic"], where:{observation:{[Op.not]:''}}}, {model: Personnel,required: true, where: {nom:req.session.user.nom}}], where: {date: {[Op.not]: null}, specialite:{[Op.is]: req.session.user.specialite/*, '$Carnet.observation$': {[Op.not]: null}, '$Carnet.diagnostic$': {[Op.not]: null}*/}},order: [["id","DESC"]] }) 
    const listRDV = await Consultation.findAll({
        include: [
          { model: Patient, required: true },
          { model: Parametre, required: true },
          { model: Personnel, required: true },
          { model: Carnet, required: false }
        ],
        where: {
          '$Parametre.date_rendez_vous$': {
            [Op.gte]: moment().toDate(),
            [Op.lt]: moment().add(1, 'days').toDate()
          }
        }
    });

    const medicaments = await Medicament.findAll({order: [["id","DESC"]] })
    const number = medicaments.length
    let nomsMedicaments = [];
    for (let i = 0; i < medicaments.length; i++) {
      nomsMedicaments.push(medicaments[i].nom);
    }

    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)); // 3 mois à partir d'aujourd'hui
    
    const medicamentsExpire = await Medicament.findAll({
      where: {
        expiration: {
          [Op.lte]: expirationDate
        }
      },
      order: [["id","DESC"]]
    });
    // let nomsMedicamentsExpire = [];
    // for (let i = 0; i < medicamentsExpire.length; i++) {
    //   if (medicamentsExpire[i].nom) {
    //     nomsMedicamentsExpire.push(medicamentsExpire[i].nom);
    //   } else {
    //     console.error(`Médicament with ID ${medicamentsExpire[i].id} has no 'nom' property.`);
    //   }
    // }

    // Récupération de toutes les consultations avec un montant
    const listP = await Consultation.findAll({ 
        include: Patient, 
        order: [["id","DESC"]], 
        where: { montant: { [Op.not]: null } }
    });
    
    // Initialisation du tableau des totaux mensuels
    const monthlyTotals = new Array(12).fill(0).map(Number);

    // Parcours de la liste des consultations
    listP.forEach(consultation => {
        // Récupération du mois de la consultation
        const month = new Date(consultation.createdAt).getMonth();

        // Conversion du montant en nombre
        const montantNumber = parseFloat(consultation.montant);
        
        // Ajout du montant de la consultation au total du mois correspondant
        monthlyTotals[month] += montantNumber;
    });

    // Affichage du tableau des totaux mensuels
    console.table(monthlyTotals);

    const patients = await Patient.findAll({order: [["id","DESC"]]}) 

    const patientCountByMonth = await Patient.findAll({
        attributes: [
          [fn('strftime', '%Y-%m-01', col('createdAt')), 'month'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [fn('strftime', '%Y-%m-01', col('createdAt'))],
        order: [[col('month'), 'ASC']]
    });
    // Créer un tableau vide pour stocker les counts
    const annualCounts = new Array(12).fill(0);

    // Parcourir le tableau patientCountByMonth
    patientCountByMonth.forEach(record => {
    // Extraire le mois de la date
    const month = new Date(record.dataValues.month).getMonth();

    // Stocker le count dans le tableau annualCounts à l'index correspondant au mois
    annualCounts[month] = record.dataValues.count;
    });

    // Le tableau annualCounts contient maintenant les counts ordonnés de janvier à décembre
    //console.log(listConsultation);
    res.render("administrator/dashboard",{ personnel: list, patients: patients, annualCounts: annualCounts,
         listConsultation: listConsultation, listRDV: listRDV, medicaments: medicaments, medicamentsExpire : medicamentsExpire,
         monthlyTotals : monthlyTotals})    
})

.get('/dashboard',  async (req, res)=>{
    const list = await Personnel.findAll({where:{specialite:{[Op.ne]:"administrator"} },order: [["id","DESC"]] })
    const listConsultation = await Consultation.findAll({include: [{model: Patient,required: true}, {model: Carnet,required: true, attributes:["observation","diagnostic"], where:{observation:{[Op.not]:''}}}, {model: Personnel,required: true, where: {nom:req.session.user.nom}}], where: {date: {[Op.not]: null}, specialite:{[Op.is]: req.session.user.specialite/*, '$Carnet.observation$': {[Op.not]: null}, '$Carnet.diagnostic$': {[Op.not]: null}*/}},order: [["id","DESC"]] }) 
    const listRDV = await Consultation.findAll({
        include: [
          { model: Patient, required: true },
          { model: Parametre, required: true },
          { model: Personnel, required: true },
          { model: Carnet, required: false }
        ],
        where: {
          '$Parametre.date_rendez_vous$': {
            [Op.gte]: moment().toDate(),
            [Op.lt]: moment().add(1, 'days').toDate()
          }
        }
    });

    const medicaments = await Medicament.findAll({order: [["id","DESC"]] })
    const number = medicaments.length
    let nomsMedicaments = [];
    for (let i = 0; i < medicaments.length; i++) {
      nomsMedicaments.push(medicaments[i].nom);
    }

    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)); // 3 mois à partir d'aujourd'hui
    
    const medicamentsExpire = await Medicament.findAll({
      where: {
        expiration: {
          [Op.lte]: expirationDate
        }
      },
      order: [["id","DESC"]]
    });
    // let nomsMedicamentsExpire = [];
    // for (let i = 0; i < medicamentsExpire.length; i++) {
    //   if (medicamentsExpire[i].nom) {
    //     nomsMedicamentsExpire.push(medicamentsExpire[i].nom);
    //   } else {
    //     console.error(`Médicament with ID ${medicamentsExpire[i].id} has no 'nom' property.`);
    //   }
    // }

    // Récupération de toutes les consultations avec un montant
    const listP = await Consultation.findAll({ 
        include: Patient, 
        order: [["id","DESC"]], 
        where: { montant: { [Op.not]: null } }
    });
    
    // Initialisation du tableau des totaux mensuels
    const monthlyTotals = new Array(12).fill(0).map(Number);

    // Parcours de la liste des consultations
    listP.forEach(consultation => {
        // Récupération du mois de la consultation
        const month = new Date(consultation.createdAt).getMonth();

        // Conversion du montant en nombre
        const montantNumber = parseFloat(consultation.montant);
        
        // Ajout du montant de la consultation au total du mois correspondant
        monthlyTotals[month] += montantNumber;
    });

    // Affichage du tableau des totaux mensuels
    console.table(monthlyTotals);

    const patients = await Patient.findAll({order: [["id","DESC"]]}) 

    const patientCountByMonth = await Patient.findAll({
        attributes: [
          [fn('strftime', '%Y-%m-01', col('createdAt')), 'month'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [fn('strftime', '%Y-%m-01', col('createdAt'))],
        order: [[col('month'), 'ASC']]
    });
    // Créer un tableau vide pour stocker les counts
    const annualCounts = new Array(12).fill(0);

    // Parcourir le tableau patientCountByMonth
    patientCountByMonth.forEach(record => {
    // Extraire le mois de la date
    const month = new Date(record.dataValues.month).getMonth();

    // Stocker le count dans le tableau annualCounts à l'index correspondant au mois
    annualCounts[month] = record.dataValues.count;
    });

    // Le tableau annualCounts contient maintenant les counts ordonnés de janvier à décembre
    //console.log(listConsultation);
    res.render("administrator/dashboard",{ personnel: list, patients: patients, annualCounts: annualCounts,
         listConsultation: listConsultation, listRDV: listRDV, medicaments: medicaments, medicamentsExpire : medicamentsExpire,
         monthlyTotals : monthlyTotals})    
})

//liste des patients
.get('/patient-list',  async (req, res)=>{
    const list = await Patient.findAll({order: [["id","DESC"]] }) 
    console.log(list)
    
    res.render("administrator/patient-list",{ patient: list})    
})

//get a patient by ID
.get('/patient/:id', async(req, res)=>{
    const requestedID = req.params.id
    const patient = await Patient.findOne({where: {id:requestedID}})
    if(patient){
        res.render("administrator/info-patient",{patient: patient})
    }
    else{
        res.redirect("/fulltang/V0/administrator") 
    }
    
})

//delete patient
.post('/patient/:id', async(req, res)=>{
    const id = req.params.id

    const consultation = await Consultation.findOne({where: {patientId: id}})

    if(consultation){
        req.flash("negative","impossible de supprimer ce patient car il a déja effectué des actions dans le systeme")
        res.redirect("/fulltang/V0/administrator/patient/"+id) 
    }
    else{
        await Patient.destroy({ where: {id: id}})
        req.flash("positive","le patient a été supprimé")
        res.redirect("/fulltang/V0/receptionnist") 

    }
})

//update form
.get('/edit-patient/:id', async(req, res)=>{
    const requestedID = req.params.id
    const patient = await Patient.findOne({where: {id:requestedID}})
    if(patient){
        res.render("administrator/edit-patient",{patient: patient})
    }
    else{
        res.redirect("/fulltang/V0/administrator") 
    }  
    
})

//Update patient
.post('/edit-patient/:id', async(req, res)=>{
    const requestedID = req.params.id
    await Patient.update(req.body,{where: { id: requestedID }})
    req.flash("positive","informations modifiées avec succès")
    res.redirect("/fulltang/V0/administrator/patient/"+requestedID) 
})

//liste du personnels
.get('/personnel-list',  async (req, res)=>{
    const list = await Personnel.findAll({where:{specialite:{[Op.ne]:"administrator"} },order: [["id","DESC"]] }) 
    
    res.render("administrator/personnel-list",{ personnel: list})    
})

//ajouter un personnel
.get('/add_personnel',  async (req, res)=>{
    res.render("administrator/add-personnel")    
})

.post('/add_personnel', async (req, res) => {
    try {
      const personnel = req.body;
      personnel.password = "fultang";
      personnel.url_image = "/upload/avatar.jpg";
  
      // Vérifier si un personnel avec le même email existe déjà
      const existingPersonnel = await Personnel.findOne({ where: {email: personnel.email }});
  
      if (existingPersonnel) {
        // Un personnel avec le même email existe déjà
        req.flash("negative", "Un personnel avec cet email existe déjà");
      } else {
        // Aucun personnel avec le même email n'existe, créer le personnel
        await Personnel.create(personnel);
        req.flash("positive", "Nouveau personnel ajouté avec succès");
        
      }
      res.redirect("/fulltang/V0/administrator");
    } catch (error) {
      // Gérer les erreurs
      console.error(error);
      req.flash("negative", "Une erreur s'est produite lors de l'ajout du personnel");
      res.redirect("/fulltang/V0/administrator");
    }
})

.get('/personnel/:id',  async (req, res)=>{
    const id = req.params.id
    const personnel = await Personnel.findOne({where: {id:id}})
    if(personnel){
        res.render("administrator/info-personnel",{personnel: personnel})
    }
    else{
        res.redirect("/fulltang/V0/administrator") 
    }  
})

//update form
.get('/edit/:id', async(req, res)=>{
    const requestedID = req.params.id
    const personnel = await Personnel.findOne({where: {id:requestedID}})
    if(personnel){
        res.render("administrator/edit-personnel",{personnel: personnel})
    }
    else{
        res.redirect("/fulltang/V0/administrator") 
    }    
})

//Update personnel
.post('/edit/:id', async(req, res)=>{
    const requestedID = req.params.id
    await Personnel.update(req.body,{where: { id: requestedID }})
    req.flash("positive","informations modifiées avec succès")
    res.redirect("/fulltang/V0/administrator/personnel/"+requestedID) 
})


//// examen crud


// ajouter examen
.get('/add_examen',  async (req, res)=>{
    res.render("administrator/add-examen")    
})

.post('/add_examen',  async (req, res)=>{
    await Examen.create(req.body)
    req.flash("positive","nouvel examen ajouté avec succès")
    res.redirect("/fulltang/V0/administrator/examen_list") 
})

//liste des examens
.get('/examen_list',  async (req, res)=>{
    const list = await Examen.findAll({order: [["id","DESC"]] })
    res.render("administrator/examen-list",{examen: list})    
})

// supprimer un examen
.post('/examen_list',  async (req, res)=>{

    const id=req.body.id
    const resultat= await Resultat.findOne({where: {examenId: id}})

    if(resultat){
        req.flash("negative","impossible de supprimer cet examen car il a déja été utilisé dans le système")
        res.redirect("/fulltang/V0/administrator/examen_list") 
    }
    else{
        await Examen.destroy({ where: {id: id}})
        req.flash("positive","Examen supprimé avec succès")
        res.redirect("/fulltang/V0/administrator/examen_list") 

    }
})

//liste des consultations
.get('/consultation_history',  async (req, res)=>{

    const list = await Consultation.findAll({include: [{model: Patient,required: true}, {model: Carnet,required: true, attributes:["observation","diagnostic"], where:{observation:{[Op.not]:''}}}, {model: Personnel,required: true}], where: {date: {[Op.not]: null/*, '$Carnet.observation$': {[Op.not]: null}, '$Carnet.diagnostic$': {[Op.not]: null}*/}},order: [["id","DESC"]] }) 
    res.render("administrator/consultation-history",{ consultation: list})    

})

//liste des rendez-vous
.get('/consultation_historyRDV',  async (req, res)=>{
    const listRDV = await Consultation.findAll({
        include: [
          { model: Patient, required: true },
          { model: Parametre, required: true },
          { model: Personnel, required: true },
          { model: Carnet, required: false }
        ],
        where: {
          '$Parametre.date_rendez_vous$': {
            [Op.gte]: moment().toDate(),
            [Op.lt]: moment().add(1, 'days').toDate()
          }
        }
    }); 
    res.render("administrator/consultation-historyRDV",{ consultation: listRDV})    

})

////carnet du patient
.get('/carnet_patient/:id',  async (req, res)=>{

    let id=req.params.id;
    const patient= await Patient.findOne({ where: {id: id}, attributes: ["nom","prenom"] })

    if(patient){
        const consultation = await Consultation.findAll({ include:[{model: Examen,attributes: ["nom"]},{model: Personnel,attributes: ["nom"],required: true},{model: Medicament,attributes: ["nom"]},{model: Parametre, required: true}, {model: Carnet, required: false, attributes:["date","observation","diagnostic"]}] ,where:{ date: {[Op.not]: null},patientId: id},order: [["id","DESC"]] }) 
        //consultation.forEach( async(i) =>{
        for(const i of consultation){
            if(i.carnet===null){
                const carnet =  await Carnet.create({
                    montant: consultation.montant,
                    date: consultation.date,
                    observation: '',
                    diagnostic: '',
                    specialite: consultation.specialite,
                    paye: consultation.paye,
                    rendez_vous: consultation.rendez_vous,
                })
                await i.setCarnet(carnet);
                await i.save();
            }
        }
        //})
        const carnet = await Consultation.findAll({ include:[{model: Examen,attributes: ["nom"]},{model: Personnel,attributes: ["nom"],required: true},{model: Medicament,attributes: ["nom"]},{model: Parametre, required: true}, {model: Carnet, required: true, attributes:["date","observation","diagnostic"]}] ,where:{ date: {[Op.not]: null},patientId: id},order: [["id","DESC"]] }) 
        res.render("administrator/carnet", {carnet: carnet, patient: patient}) 
    }else{
        res.redirect("/fulltang/V0/administrator/consultation_history")
    }
       
})

// editer un examen
.get('/examen/:id/edit',  async (req, res)=>{

    const id = req.params.id
    const list = await Examen.findOne({where: {id:id}})

    if(list){
        res.render("administrator/edit-examen",{examen: list})
    }
    else{
        res.redirect("/fulltang/V0/administrator/examen_list")
    }
        
})

.post('/examen/:id/edit',  async (req, res)=>{

    const id = req.params.id
    await Examen.update(req.body,{where: { id: id }})
    req.flash("positive","Examen modifié avec succès")
    res.redirect("/fulltang/V0/administrator/examen_list") 

})


//// medicament crud


// ajouter medicament
.get('/add_medicament',  async (req, res)=>{
    res.render("administrator/add-medicament")    
})

.post('/add_medicament', async (req, res) => {
    const { nom, description, prix, categorie, expiration, nombre } = req.body;
    const { image } = req.files;
    const urlImage = image ? `/image/${image.name}` : null;
  
    await Medicament.create({ nom, description, prix, categorie, expiration, urlImage, nombre });
    req.flash("positive", "nouveau medicament ajouté avec succès");
    res.redirect("/fulltang/V0/administrator/medicament_list");
})  

//liste des emedicament
.get('/medicament_list',  async (req, res)=>{
    const list = await Medicament.findAll({order: [["id","DESC"]] })
    console.log(list)
    res.render("administrator/medicament-list",{medicament: list})    
})

// supprimer un medicament
.post('/medicament_list',  async (req, res)=>{

    const id=req.body.id
    const prescription= await Prescription.findOne({where: {medicamentId: id}})

    if(prescription){
        req.flash("negative","impossible de supprimer ce medicament car il a déja été utilisé dans le système")
        res.redirect("/fulltang/V0/administrator/medicament_list") 
    }
    else{
        await Medicament.destroy({ where: {id: id}})
        req.flash("positive","medicament supprimé avec succès")
        res.redirect("/fulltang/V0/administrator/medicament_list") 

    }
})



// editer un medicament
.get('/medicament/:id/edit',  async (req, res)=>{

    const id = req.params.id
    const list = await Medicament.findOne({where: {id:id}})

    if(list){
        res.render("administrator/edit-medicament",{medicament: list})
    }
    else{
        res.redirect("/fulltang/V0/administrator/medicament_list")
    }
        
})

.post('/medicament/:id/edit',  async (req, res)=>{

    const id = req.params.id
    await Medicament.update(req.body,{where: { id: id }})
    req.flash("positive","medicament modifié avec succès")
    res.redirect("/fulltang/V0/administrator/medicament_list") 

})

//afficher profil
.get('/profil',  async (req, res)=>{
    const user = await Personnel.findOne({ where:{id: req.session.user.id } }) 
    res.render("administrator/profil",{User: user})
    
})

//modifier profil
.get('/modifier_profil',  async (req, res)=>{
    const user = await Personnel.findOne({ where:{id: req.session.user.id} }) 
    res.render("administrator/modifier-profil",{User: user})
    
})
.post('/modifier_profil',  async (req, res)=>{

    let data=req.body
    if(req.files){
        let image=req.files.image
        image.mv("./static/upload/"+image.name)
        data.url_image="/upload/"+image.name 
        req.session.user.url="/upload/"+image.name 
    }
   
    await Personnel.update(data,{where: { id: req.session.user.id}})
        req.flash("positive","profil modifié avec succès")
        res.redirect("/fulltang/V0/administrator/profil")
    
    
})

.get('/profil/password',  async (req, res)=>{
    
    res.render("administrator/modifier-password")
    
})
.post('/profil/password',  async (req, res)=>{
    
    let data= req.body
    const user = await Personnel.findOne({ where:{id: req.session.user.id ,password: data.password}}) 

    if(user){
        
        if(data.n_password == data.c_password){

            await Personnel.update({password:data.n_password},{where: { id: req.session.user.id}})
            req.flash("positive","mot de passe modifié avec succès")
            res.redirect("/fulltang/V0/administrator/profil")

        }else{
            req.flash("negative","mot de passe de confirmation incorrect")
            res.redirect("/fulltang/V0/administrator/profil/password")
        }

    }else{
        req.flash("negative","mot de passe actuel incorrect")
        res.redirect("/fulltang/V0/administrator/profil/password")
    }

    
})

module.exports = router