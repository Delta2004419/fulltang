const express = require('express')
const router = express.Router()
const Patient = require('../../models/Patient')
const Consultation = require('../../models/Consultation')
const Parametre = require('../../models/Parametres')
const Examen = require('../../models/Examen')
const Medicament = require('../../models/Medicament')
const Prescription = require('../../models/Prescription')
const Resultat = require('../../models/Resultat')
const { EMPTY } = require('sqlite3')
const { Op } = require('sequelize')
const Personnel = require('../../models/Personnel')


router.use(express.json())

router.use((req,res,next)=>{
    if(req.session.user.specialite!="infirmier"){
        if(["cashier","administrator","labtechnician"].includes(req.session.user.specialite)){ 
            res.redirect("/fulltang/V0/"+req.session.user.specialite)
          }else{
            res.redirect("/fulltang/V0/doctor")
        }
      
    }else{
        next()
    }
})

// all specialist routes implemented here...
.get('/',  async (req, res)=>{
    const list = await Consultation.findAll({ include: [{model: Patient,required: true},{model: Parametre,required:false},{model: Personnel,required:false}], where: { [Op.or]:[{paye: "payer",date: null},{rendez_vous: "oui",date: null}],[Op.or]:[{'$Parametre.id$':null,date: null},{'$Personnel.id$':null,date: null}] },order: [["id","DESC"]] }) 
    res.render("infirmier/patient-list",{ consultation: list})    
})

// historique des consultation
.get('/consultation_history',  async (req, res)=>{

    const list = await Consultation.findAll({ include: [{model: Patient,required: true}, {model: Personnel,required: true}, {model: Parametre,required: true}], where: {'$Parametre.id$': {[Op.not]: null}, '$Personnel.id$': {[Op.not]: null} },order: [["id","DESC"]] }) 
    const listRDV = await Parametre.findAll({ order: [["id","DESC"]] }) 
    // console.log(listRDV)
    res.render("infirmier/consultation-history",{ consultation: list})  

})

/*
.post('/consultation_history',  async (req, res)=>{

    const id=req.body.id

    const list = await Consultation.findOne({where: { id: id}})
    if(list.paye=="payer" || list.date!= null){
        req.flash("negative","impossible de supprimer cette consultation a déja été effectué")
        res.redirect("/fulltang/V0/receptionnist/consultation_history")
    }else{
        await Consultation.destroy({ where: {id: id}})
        req.flash("positive","consultation effectué avec succès")
        res.redirect("/fulltang/V0/receptionnist/consultation_history")
    }

})*/

//consulter un patient
.get('/consultation/:id',  async (req, res)=>{
    const requestedID = req.params.id
    const list = await Consultation.findOne({ include: {model: Patient,required: true}, where: { [Op.or]:[{id: requestedID ,paye: "payer",date: null},{id: requestedID ,rendez_vous: "oui",date: null}, {id: requestedID ,rendez_vous: "non",date: null}]  } })
    
    const specialite= list.specialite

    if(list){
        const medecins = await Personnel.findAll({where: [{specialite: ["generaliste", "neurologue", "gynecologue", "cardiologue", "Gastro-enterologue", "nephrologue"]}, {specialite}], attributes: ['nom','specialite']})
        // Mettre à jour le patient dans la base de données avec le médecin sélectionné
        const groupe_sanguin =['A','B', 'AB', 'O']
        const rhesus =['+', '-']
        const carnet = await Consultation.findAll({ include:[{model: Parametre, required: true}], where:{ date: {[Op.not]: null},patientId: "list.patient.id"},order: [["id","DESC"]] }) 
        res.render("infirmier/consultation",{patient: list.patient, carnet:carnet, medecins:medecins, groupe_sanguin: groupe_sanguin, rhesus: rhesus})  
    }else{
        res.redirect("/fulltang/V0/doctor")
    }  

   
})

//enregistrer la consultation
.post('/consultation/:id', async (req, res) => {
    try {
      let id = req.params.id;
  
      const parametre = await Parametre.create({
        poids: req.body.poids,
        temperature: req.body.temperature,
        pression_arterielle_systolique: req.body.tension_systolique,
        pression_arterielle_diastolique: req.body.tension_diastolique,
        groupe_sanguin: req.body.groupe_s,
        rhesus: req.body.rhesus,
        date_rendez_vous: req.body.date_rdv,
      });
      console.log(parametre)
      const consultation = await Consultation.findByPk(id);

      if (!consultation) {
        throw new Error('Consultation not found');
      }
  
      // Associer le paramètre à la consultation
      await consultation.setParametre(parametre);
  
      // Associer le médecin à la consultation
      const medecinNom = req.body.medecin;
      const medecin = await Personnel.findOne({ where: { nom: medecinNom } });

    if (!medecin) {
        throw new Error('Medecin not found');
    }

    await consultation.setPersonnel(medecin);
    consultation.date= new Date()
    await consultation.save();
    //await consultation.update({date: new Date()})
  
      req.flash('positive', 'Consultation enregistrée avec succès');
      res.redirect('/fulltang/V0/infirmier/consultation_history');
    } catch (error) {
      // Gérer les erreurs
      console.error(error);
      req.flash('error', 'Une erreur s\'est produite');
      res.redirect('/fulltang/V0/infirmier/consultation_history');
    }
})

////carnet du patient
.get('/carnet_patient/:id',  async (req, res)=>{

    let id=req.params.id;
    const patient= await Patient.findOne({ where: {id: id}, attributes: ["nom","prenom"] })

    if(patient){
        const carnet = await Consultation.findAll({ include:[{model: Examen,attributes: ["nom"]},{model: Personnel,attributes: ["nom"],required: true},{model: Medicament,attributes: ["nom"]},{model: Parametre, required: true}],attributes:["date","observation","diagnostic"] ,where:{ date: {[Op.not]: null},patientId: id},order: [["id","DESC"]] }) 
        res.render("infirmier/carnet", {carnet: carnet, patient: patient}) 
    }else{
        res.redirect("/fulltang/V0/infirmier/consultation_history")
    }
       
})

/*// new consultation
.get('/new_consultation/:id',  async (req, res)=>{
    const requestedID = req.params.id
    const patient = await Patient.findOne({where: {id:requestedID}})
    if(patient){
        const carnet = await Consultation.findAll({ include:[{model: Examen,attributes: ["nom"]},{model: Personnel,attributes: ["nom"],required: true},{model: Medicament,attributes: ["nom"]},{model: Parametre, required: true}],attributes:["date","observation","diagnostic"] ,where:{ date: {[Op.not]: null},patientId: requestedID},order: [["id","DESC"]] }) 
        res.render("infirmier/new-consultation",{patient: patient, carnet: carnet})
    }
    else{
        res.redirect("/fulltang/V0/infirmier") 
    }    
})

.post('/new_consultation/:id',  async (req, res)=>{

    let data=req.body 

    if(data.rendez_vous){
        data.paye="non payer"

    }else{
        
        data.rendez_vous="non"

    }

    await Consultation.create(data)

    const list = await Consultation.findOne({ include: {model: Patient,attributes:["nom","prenom","sexe"],where:{id :data.patientId }, required: true}, order: [["id","DESC"]] }) 

    if(list.rendez_vous=="oui"){
        io.emit('consultation_paid', list )
    }else{
        io.emit('new_consultation', list)
    }

    req.flash("positive","consultation creé avec succès")
    res.redirect("/fulltang/V0/receptionnist/consultation_history") 

})*/

/*
//afficher profil
.get('/profil',  async (req, res)=>{
    const user = await Personnel.findOne({ where:{id: req.session.user.id } }) 
    res.render("infirmier/profil",{User: user})
    
})

//modifier profil
.get('/modifier_profil',  async (req, res)=>{
    const user = await Personnel.findOne({ where:{id: req.session.user.id} }) 
    res.render("infirmier/modifier-profil",{User: user})
    
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
        res.redirect("/fulltang/V0/infirmier/profil")
    
    
})
.get('/profil/password',  async (req, res)=>{
    
    res.render("infirmier/modifier-password")
    
})
.post('/profil/password',  async (req, res)=>{
    
    let data= req.body
    const user = await Personnel.findOne({ where:{id: req.session.user.id ,password: data.password}}) 

    if(user){
        
        if(data.n_password == data.c_password){

            await Personnel.update({password:data.n_password},{where: { id: req.session.user.id}})
            req.flash("positive","mot de passe modifié avec succès")
            res.redirect("/fulltang/V0/infirmier/profil")

        }else{
            req.flash("negative","mot de passe de confirmation incorrect")
            res.redirect("/fulltang/V0/infirmier/profil/password")
        }

    }else{
        req.flash("negative","mot de passe actuel incorrect")
        res.redirect("/fulltang/V0/infirmier/profil/password")
    }

    
})
*/

module.exports = router