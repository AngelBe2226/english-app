// Claves de progreso que no son respuestas de quiz. Todo lo que el usuario
// espera ver en todos sus dispositivos vive en el almacén de progreso (y por
// tanto se sincroniza); el tema claro/oscuro sigue siendo por dispositivo.
export const K_LAST_BLOCK = "nav:lastBlock";
export const K_PLACEMENT = "placement:result";
export const K_SRS_META = "srs:meta";
export const SRS_CARD_PREFIX = "srs:c:";
export const srsCardKey = (id) => SRS_CARD_PREFIX + id;
