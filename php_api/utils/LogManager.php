<?php
namespace app\utils;

class LogManager {
    public static function toLog($cont, $file){
        try {
            // Solo usar error_log para evitar problemas de permisos
            $fecha = new \DateTime();
            $logData = $fecha->format('Y-m-d H:i:s') . ' ' . json_encode($cont, JSON_UNESCAPED_SLASHES);
            error_log("[$file] $logData");
        } catch (\Exception $e) {
            error_log("Error en LogManager: " . $e->getMessage());
        }
    }
}