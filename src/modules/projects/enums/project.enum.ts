export enum ProjectStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PLANNING = 'planning',
    EXECUTION = 'execution',
    SUSPENDED = 'suspended',
    FINISHED = 'finished'
}

export enum TypeProject {
    INVESTMENT = 'investment',     //inversión solo plata  nada de campañas ni personas
    SOCIAL_ACTION = 'social_action'
}

export enum MetricProject {
    AMOUNT_INVESTED = 'amount_invested',   //la plata que se invierte porque puede sobrar del monto del proyecto, solo aplica cuando es de inversión
    TOTAL_BENEFICIATED_PERSONS = 'beneficiated_persons',  //cantidad de personas beneficiadas sumadas de todas las campañas asociadas en estado terminado
    TOTAL_WASTE_COLLECTED = 'waste_collected',  //involucra personas pero en este aspecto lo que importa son los kilos recolectados
    TOTAL_TREES_PLANTED = 'trees_planted',  //involucra personas pero en este aspecto lo que importa son los árboles sembrados
}
