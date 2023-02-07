<?php
namespace app\utils;

const BASE_PATH    = '/var/www/gfc.prod-api.greenborn.com.ar/';
const RUNTIME_DIR  = 'runtime/';
const LOGS_PATH    = BASE_PATH.RUNTIME_DIR;

class LogManager {
    public static function toLog($cont, $file){
        $fp = fopen( LOGS_PATH.$file, 'a');
        if (!$fp) echo "Error leyendo archivo log";
        $fecha = new \DateTime();
        fwrite($fp, $fecha->format('Y-m-d H:i:s').json_encode($cont, JSON_UNESCAPED_SLASHES)."\n");
        fclose($fp);
    }
}