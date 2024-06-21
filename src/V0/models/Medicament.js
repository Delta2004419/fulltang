const {Model, DataTypes} = require('sequelize')
const sequelize = require('../repository/database')
const Consultation = require('./Consultation')
const Prescription = require('./Prescription')

class Medicament extends Model {}

Medicament.init({
    urlImage:{
        type: DataTypes.TEXT        
    },
    nom:{
        type: DataTypes.TEXT        
    },
    description:{
        type: DataTypes.TEXT        
    },
    prix:{
        type: DataTypes.INTEGER       
    },
    categorie:{
        type: DataTypes.TEXT        
    },
    expiration:{
        type: DataTypes.DATE     
    },
    nombre:{
        type: DataTypes.NUMBER     
    }
}, {
    sequelize,
    modelName: 'medicament'
}
)

// Medicament.belongsToMany(Consultation, {through:Prescription})

module.exports = Medicament
