export enum TypeActivity {
    CONFERENCE = 'conference',
    WORKSHOP = 'workshop',
    REFORESTATION = 'reforestation',
    GARBAGE_COLLECTION = 'garbage_collection',  //recolección de basura 
    SPECIAL_EVENT = 'special_event',
    CLEANUP = 'cleanup',  //para ser general en tipos de limpieza pueden ser de ríos, playas entre otros.
    CULTURAL_EVENT = 'cultutal_event'
}

export enum ActivityStatus {  //estado de la campaña
    PENDING = 'pending',
    PLANNING = 'planning',
    EXECUTION = 'execution',
    SUSPENDED = 'suspended',
    FINISHED = 'finished',
}

export enum TypeApproach {
    SOCIAL = 'social',
    CULTURAL = 'cultural',
    ENVIRONMENTAL = 'environmental'
}

export enum TypeFavorite {
    SCHOOL = 'school',
    CONDOMINIUNM = 'condominium'
}

export enum MetricType {
    ATTENDANCE = 'attendance',  //cantidad bruta de quienes asistieron
    TREES_PLANTED = 'trees_planted',   //cantidad bruta de cuantos árboles sembrados
    WASTE_COLLECTED = 'waste_collected',   //cantidad bruta de kilos recolectados en limpieza en una campaña
}

//Nota: la cantidad de personas que se inscriben se sacan de la tabla enrrollment