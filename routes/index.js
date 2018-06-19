const user = require('./user'); 
const category = require('./category'); 
const platform = require('./platform'); 
const project = require('./project'); 
const admin = require('./admin'); 
const milestones=require('./milestones');
const subscriber=require('./subscriber')
const designer=require('./designer')
const campaign=require('./campaign')
const ama=require('./amaCampaign');
const domain_details=require('./domains_details');
const payment=require('./projectPayment');
const activitiesCards=require('./activitiesCards');
const careers = require('./careers');
const collaboration = require('./collaboration');
const  paymenthistory = require('./paymentHistory');
const productJourney = require('./productJourney');

module.exports = function (app) {
app.use('/admin', admin); 
	app.use('/user', user);
	app.use('/designer',designer) 
	app.use('/category', category); 
	app.use('/platform', platform); 
	app.use('/project', project); 
	app.use('/milestones',milestones)
	app.use('/subscriber',subscriber)
	app.use('/campaign',campaign);
	app.use('/ama',ama);
	app.use('/domain_details',domain_details);
	app.use('/payment',payment);
	app.use('/activitiesCards',activitiesCards);
	app.use('/careers',careers);
	app.use('/collaboration',collaboration);
	app.use('/paymenthistory',paymenthistory);
	app.use('/productJourney',productJourney);
}
