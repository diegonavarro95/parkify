-- ============================================
-- PARKIFY - BASE DE DATOS FINAL BLINDADA (SUPABASE)
-- Versión: Producción Robusta
-- ============================================

-- 1. LIMPIEZA TOTAL (Reset)
DROP VIEW IF EXISTS vw_historial_accesos;
DROP VIEW IF EXISTS vw_estadisticas_hoy;
DROP VIEW IF EXISTS vw_pases_vencidos_dentro;
DROP VIEW IF EXISTS vw_vehiculos_dentro;
DROP TABLE IF EXISTS estadisticas_diarias CASCADE;
DROP TABLE IF EXISTS logs_auditoria CASCADE;
DROP TABLE IF EXISTS notificaciones_pase_vencido CASCADE;
DROP TABLE IF EXISTS reportes CASCADE;
DROP TABLE IF EXISTS accesos CASCADE;
DROP TABLE IF EXISTS cajones_motos CASCADE;
DROP TABLE IF EXISTS pases CASCADE;
DROP TABLE IF EXISTS vehiculos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Eliminar tipos
DROP TYPE IF EXISTS nivel_log_enum;
DROP TYPE IF EXISTS estado_reporte_enum;
DROP TYPE IF EXISTS estado_cajon_enum;
DROP TYPE IF EXISTS metodo_validacion_enum;
DROP TYPE IF EXISTS tipo_acceso_enum;
DROP TYPE IF EXISTS estado_pase_enum;
DROP TYPE IF EXISTS tipo_vehiculo_enum;
DROP TYPE IF EXISTS rol_usuario_enum;
DROP TYPE IF EXISTS tipo_usuario_enum;

-- ============================================
-- 2. EXTENSIONES Y ENUMS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE tipo_usuario_enum AS ENUM ('comunidad_escom', 'visitante');
CREATE TYPE rol_usuario_enum AS ENUM ('usuario', 'admin_guardia');
CREATE TYPE tipo_vehiculo_enum AS ENUM ('automovil', 'motocicleta');
CREATE TYPE estado_pase_enum AS ENUM ('vigente', 'vencido', 'invalidado');
CREATE TYPE tipo_acceso_enum AS ENUM ('entrada', 'salida');
CREATE TYPE metodo_validacion_enum AS ENUM ('placas', 'folio', 'qr', 'curp');
CREATE TYPE estado_cajon_enum AS ENUM ('disponible', 'ocupado', 'mantenimiento');
CREATE TYPE estado_reporte_enum AS ENUM ('nuevo', 'en_revision', 'atendido', 'cerrado');
CREATE TYPE nivel_log_enum AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- ============================================
-- 3. TABLAS
-- ============================================

-- USUARIOS
CREATE TABLE usuarios (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id),
    curp VARCHAR(18) UNIQUE NOT NULL,
    tipo_usuario tipo_usuario_enum NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    correo_electronico VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(15),
    rol rol_usuario_enum NOT NULL DEFAULT 'usuario',
    activo BOOLEAN NOT NULL DEFAULT true,
    intentos_login_fallidos INTEGER NOT NULL DEFAULT 0,
    fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- VEHICULOS
CREATE TABLE vehiculos (
    id_vehiculo SERIAL PRIMARY KEY,
    id_usuario UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo tipo_vehiculo_enum NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    color VARCHAR(30) NOT NULL,
    placas VARCHAR(20) UNIQUE NOT NULL, -- Un poco más largo para permitir espacios antes del trigger
    foto_documento_validacion TEXT,
    numero_boleta VARCHAR(15),
    rfc VARCHAR(15),
    fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- PASES
CREATE TABLE pases (
    id_pase SERIAL PRIMARY KEY,
    folio VARCHAR(20) UNIQUE NOT NULL,
    id_vehiculo INTEGER NOT NULL REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
    codigo_qr_path TEXT,
    pdf_path TEXT,
    fecha_emision TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    estado estado_pase_enum NOT NULL DEFAULT 'vigente',
    CONSTRAINT fecha_logica CHECK (fecha_vencimiento > fecha_emision)
);

-- CAJONES MOTOS
CREATE TABLE cajones_motos (
    id_cajon SERIAL PRIMARY KEY,
    identificador VARCHAR(10) UNIQUE NOT NULL,
    zona VARCHAR(5) NOT NULL,
    fila INTEGER NOT NULL,
    columna INTEGER NOT NULL,
    estado estado_cajon_enum NOT NULL DEFAULT 'disponible',
    id_acceso_ocupante INTEGER
);

-- ACCESOS
CREATE TABLE accesos (
    id_acceso SERIAL PRIMARY KEY,
    id_pase INTEGER NOT NULL REFERENCES pases(id_pase) ON DELETE CASCADE,
    tipo tipo_acceso_enum NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metodo_validacion metodo_validacion_enum NOT NULL,
    id_admin_guardia UUID NOT NULL REFERENCES usuarios(id_usuario),
    id_cajon_moto INTEGER REFERENCES cajones_motos(id_cajon) ON DELETE SET NULL,
    tiempo_estancia INTERVAL -- Se calcula al salir
);

-- FK Circular cajones -> accesos
ALTER TABLE cajones_motos 
ADD CONSTRAINT fk_cajon_acceso 
FOREIGN KEY (id_acceso_ocupante) REFERENCES accesos(id_acceso) ON DELETE SET NULL;

-- REPORTES
CREATE TABLE reportes (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    asunto VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    fotos_evidencia JSONB DEFAULT '[]'::jsonb,
    fecha_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    estado estado_reporte_enum NOT NULL DEFAULT 'nuevo',
    comentario_admin TEXT,
    id_admin_atendio UUID REFERENCES usuarios(id_usuario),
    eliminado BOOLEAN NOT NULL DEFAULT false
);

-- NOTIFICACIONES
CREATE TABLE notificaciones_pase_vencido (
    id_notificacion SERIAL PRIMARY KEY,
    id_pase INTEGER NOT NULL REFERENCES pases(id_pase) ON DELETE CASCADE,
    fecha_hora_notificacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    revisada BOOLEAN NOT NULL DEFAULT false,
    id_admin_reviso UUID REFERENCES usuarios(id_usuario)
);

-- LOGS
CREATE TABLE logs_auditoria (
    id_log BIGSERIAL PRIMARY KEY,
    id_usuario UUID REFERENCES usuarios(id_usuario),
    accion VARCHAR(100) NOT NULL,
    detalles JSONB,
    nivel nivel_log_enum DEFAULT 'INFO',
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ESTADISTICAS DIARIAS
CREATE TABLE estadisticas_diarias (
    fecha DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    pases_generados INTEGER DEFAULT 0,
    entradas_registradas INTEGER DEFAULT 0,
    salidas_registradas INTEGER DEFAULT 0,
    reportes_recibidos INTEGER DEFAULT 0
);

-- ============================================
-- 4. FUNCIONES DE VALIDACIÓN Y CONTROL (TRIGGERS)
-- ============================================

-- A) NORMALIZACIÓN DE PLACAS Y CURP
-- Esto garantiza que siempre se guarden en mayúsculas y sin espacios extra
CREATE OR REPLACE FUNCTION normalizar_datos()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalizar Placas en tabla vehiculos
    IF TG_TABLE_NAME = 'vehiculos' THEN
        NEW.placas := UPPER(TRIM(NEW.placas));
        NEW.placas := REGEXP_REPLACE(NEW.placas, '\s+', '', 'g'); -- Eliminar todos los espacios internos
    END IF;
    
    -- Normalizar CURP en tabla usuarios
    IF TG_TABLE_NAME = 'usuarios' THEN
        NEW.curp := UPPER(TRIM(NEW.curp));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_normalizar_vehiculos
BEFORE INSERT OR UPDATE ON vehiculos
FOR EACH ROW EXECUTE FUNCTION normalizar_datos();

CREATE TRIGGER tr_normalizar_usuarios
BEFORE INSERT OR UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION normalizar_datos();


-- B) VALIDACIÓN DE SECUENCIA DE ACCESO (ANTI DOBLE ENTRADA/SALIDA)
-- Esta es la parte crítica que pediste para control
CREATE OR REPLACE FUNCTION validar_secuencia_acceso()
RETURNS TRIGGER AS $$
DECLARE
    ultimo_tipo tipo_acceso_enum;
BEGIN
    -- Obtenemos el tipo del último acceso registrado para este pase
    SELECT tipo INTO ultimo_tipo
    FROM accesos
    WHERE id_pase = NEW.id_pase
    ORDER BY fecha_hora DESC
    LIMIT 1;

    -- Caso 1: Intentando ENTRAR
    IF NEW.tipo = 'entrada' THEN
        IF ultimo_tipo = 'entrada' THEN
            RAISE EXCEPTION 'El vehículo ya se encuentra dentro (Doble entrada detectada).';
        END IF;
    END IF;

    -- Caso 2: Intentando SALIR
    IF NEW.tipo = 'salida' THEN
        IF ultimo_tipo IS NULL OR ultimo_tipo = 'salida' THEN
            RAISE EXCEPTION 'El vehículo no tiene una entrada activa registrada (Salida sin entrada).';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_validar_secuencia
BEFORE INSERT ON accesos
FOR EACH ROW EXECUTE FUNCTION validar_secuencia_acceso();


-- C) CALCULO DE VENCIMIENTO (6 Meses / 24 Horas)
CREATE OR REPLACE FUNCTION calcular_vencimiento_pase()
RETURNS TRIGGER AS $$
DECLARE
    tipo_usr tipo_usuario_enum;
BEGIN
    SELECT u.tipo_usuario INTO tipo_usr
    FROM vehiculos v
    JOIN usuarios u ON v.id_usuario = u.id_usuario
    WHERE v.id_vehiculo = NEW.id_vehiculo;

    IF tipo_usr = 'comunidad_escom' THEN
        NEW.fecha_vencimiento := NEW.fecha_emision + INTERVAL '6 months';
    ELSE
        NEW.fecha_vencimiento := NEW.fecha_emision + INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_calcular_vencimiento
BEFORE INSERT ON pases
FOR EACH ROW EXECUTE FUNCTION calcular_vencimiento_pase();


-- D) INVALIDAR PASES ANTERIORES
CREATE OR REPLACE FUNCTION invalidar_pases_anteriores()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pases SET estado = 'invalidado'
    WHERE id_vehiculo = NEW.id_vehiculo AND id_pase != NEW.id_pase AND estado = 'vigente';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_invalidar_anteriores
AFTER INSERT ON pases
FOR EACH ROW EXECUTE FUNCTION invalidar_pases_anteriores();


-- E) GESTIÓN DE CAJONES Y TIEMPO DE ESTANCIA
CREATE OR REPLACE FUNCTION gestionar_cajones_y_tiempos()
RETURNS TRIGGER AS $$
BEGIN
    -- ENTRADA MOTO
    IF NEW.tipo = 'entrada' AND NEW.id_cajon_moto IS NOT NULL THEN
        -- Validar que el cajón esté realmente disponible (Doble check)
        IF EXISTS (SELECT 1 FROM cajones_motos WHERE id_cajon = NEW.id_cajon_moto AND estado != 'disponible') THEN
            RAISE EXCEPTION 'El cajón seleccionado ya no está disponible.';
        END IF;

        UPDATE cajones_motos
        SET estado = 'ocupado', id_acceso_ocupante = NEW.id_acceso
        WHERE id_cajon = NEW.id_cajon_moto;
    
    -- SALIDA (Cualquier vehículo)
    ELSIF NEW.tipo = 'salida' THEN
        -- 1. Si ocupaba cajón, liberarlo
        UPDATE cajones_motos
        SET estado = 'disponible', id_acceso_ocupante = NULL
        WHERE id_acceso_ocupante IN (
            SELECT id_acceso FROM accesos 
            WHERE id_pase = NEW.id_pase AND tipo = 'entrada'
        );
        
        -- 2. Calcular tiempo de estancia exacto
        UPDATE accesos
        SET tiempo_estancia = NEW.fecha_hora - (
            SELECT fecha_hora FROM accesos 
            WHERE id_pase = NEW.id_pase AND tipo = 'entrada' 
            ORDER BY fecha_hora DESC LIMIT 1
        )
        WHERE id_acceso = NEW.id_acceso;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_gestionar_cajones
AFTER INSERT ON accesos
FOR EACH ROW EXECUTE FUNCTION gestionar_cajones_y_tiempos();


-- F) ESTADISTICAS SIMPLES
CREATE OR REPLACE FUNCTION actualizar_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO estadisticas_diarias (fecha) VALUES (CURRENT_DATE) ON CONFLICT DO NOTHING;
    IF TG_TABLE_NAME = 'pases' THEN
        UPDATE estadisticas_diarias SET pases_generados = pases_generados + 1 WHERE fecha = CURRENT_DATE;
    ELSIF TG_TABLE_NAME = 'reportes' THEN
        UPDATE estadisticas_diarias SET reportes_recibidos = reportes_recibidos + 1 WHERE fecha = CURRENT_DATE;
    ELSIF TG_TABLE_NAME = 'accesos' THEN
        IF NEW.tipo = 'entrada' THEN
            UPDATE estadisticas_diarias SET entradas_registradas = entradas_registradas + 1 WHERE fecha = CURRENT_DATE;
        ELSE
            UPDATE estadisticas_diarias SET salidas_registradas = salidas_registradas + 1 WHERE fecha = CURRENT_DATE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_stats_pases AFTER INSERT ON pases FOR EACH ROW EXECUTE FUNCTION actualizar_stats();
CREATE TRIGGER tr_stats_accesos AFTER INSERT ON accesos FOR EACH ROW EXECUTE FUNCTION actualizar_stats();
CREATE TRIGGER tr_stats_reportes AFTER INSERT ON reportes FOR EACH ROW EXECUTE FUNCTION actualizar_stats();

-- ============================================
-- 5. VISTAS
-- ============================================

-- Vista: Dashboard
CREATE OR REPLACE VIEW vw_estadisticas_hoy AS
SELECT
    CURRENT_DATE AS fecha,
    COALESCE((SELECT pases_generados FROM estadisticas_diarias WHERE fecha = CURRENT_DATE), 0) as pases,
    COALESCE((SELECT entradas_registradas FROM estadisticas_diarias WHERE fecha = CURRENT_DATE), 0) as entradas,
    COALESCE((SELECT salidas_registradas FROM estadisticas_diarias WHERE fecha = CURRENT_DATE), 0) as salidas,
    (SELECT COUNT(*) FROM accesos a1 WHERE tipo='entrada' AND NOT EXISTS (SELECT 1 FROM accesos a2 WHERE a2.id_pase = a1.id_pase AND a2.tipo='salida' AND a2.fecha_hora > a1.fecha_hora)) as vehiculos_dentro,
    (SELECT COUNT(*) FROM cajones_motos WHERE estado = 'ocupado') as ocupacion_motos,
    (SELECT COUNT(*) FROM reportes WHERE estado IN ('nuevo', 'en_revision')) as reportes_pendientes;

-- Vista: Vehículos Dentro
CREATE OR REPLACE VIEW vw_vehiculos_dentro AS
SELECT 
    v.placas, v.modelo, v.color, v.tipo as tipo_vehiculo,
    u.nombre_completo, u.tipo_usuario,
    p.folio,
    a.fecha_hora as hora_entrada,
    c.identificador as cajon
FROM accesos a
JOIN pases p ON a.id_pase = p.id_pase
JOIN vehiculos v ON p.id_vehiculo = v.id_vehiculo
JOIN usuarios u ON v.id_usuario = u.id_usuario
LEFT JOIN cajones_motos c ON a.id_cajon_moto = c.id_cajon
WHERE a.tipo = 'entrada' 
AND NOT EXISTS (
    SELECT 1 FROM accesos out 
    WHERE out.id_pase = p.id_pase 
    AND out.tipo = 'salida' 
    AND out.fecha_hora > a.fecha_hora
);

-- ============================================
-- 6. POLÍTICAS RLS (SEGURIDAD)
-- ============================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su propio perfil" ON usuarios
FOR SELECT USING (auth.uid() = id_usuario OR (SELECT rol FROM usuarios WHERE id_usuario = auth.uid()) = 'admin_guardia');

CREATE POLICY "Usuarios ven sus vehiculos" ON vehiculos
FOR SELECT USING (auth.uid() = id_usuario OR (SELECT rol FROM usuarios WHERE id_usuario = auth.uid()) = 'admin_guardia');

CREATE POLICY "Usuarios registran sus vehiculos" ON vehiculos
FOR INSERT WITH CHECK (auth.uid() = id_usuario);

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;