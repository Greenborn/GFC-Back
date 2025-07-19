<?php
namespace app\utils;

class LogManager {
    public static function toLog($cont, $file){
        try {
            $fecha = new \DateTime();
            $basePath = dirname(dirname(__DIR__)) . '/';
            $logsPath = $basePath . 'runtime/';
            
            // Crear directorio si no existe
            if (!is_dir($logsPath)) {
                mkdir($logsPath, 0755, true);
            }
            
            $logFile = $logsPath . $file . $fecha->format('Y-m-d');
            $fp = fopen($logFile, 'a');
            
            if (!$fp) {
                error_log("Error abriendo archivo log: " . $logFile);
                return;
            }
            
            fwrite($fp, $fecha->format('Y-m-d H:i:s') . ' ' . json_encode($cont, JSON_UNESCAPED_SLASHES) . "\n");
            fclose($fp);
        } catch (\Exception $e) {
            error_log("Error en LogManager: " . $e->getMessage());
        }
    }
}