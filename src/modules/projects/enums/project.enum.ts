export enum ProjectStatus {
    PENDING = 'pending',
    PLANNING = 'planning',
    EXECUTION = 'execution',
    SUSPENDED = 'suspended',
    FINISHED = 'finished'
}

export enum MetricProject {
    TOTAL_BENEFICIATED_PERSONS = 'beneficiated_persons',  //cantidad de personas beneficiadas sumadas de todas las campañas asociadas en estado terminado
    TOTAL_WASTE_COLLECTED = 'waste_collected',  //involucra personas pero en este aspecto lo que importa son los kilos recolectados
    TOTAL_TREES_PLANTED = 'trees_planted',  //involucra personas pero en este aspecto lo que importa son los árboles sembrados
}