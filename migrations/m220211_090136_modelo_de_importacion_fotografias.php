<?php

use yii\db\Migration;

function insertar_categoria(&$fotografias, $nombre){
    $encontrado = false;
    foreach ($fotografias as $clave => $valor) {
        if ($clave == $nombre){
            $encontrado = true;
            break;
        }
    }
    if (!$encontrado){
        $fotografias[$nombre] = [];
    }
}

function insertar_seccion(&$fotografias, $categoria, $nombre){
    $encontrado = false;
    foreach ($fotografias[$categoria] as $clave => $valor) {
        if ($clave == $nombre){
            $encontrado = true;
            break;
        }
    }
    if (!$encontrado){
        $fotografias[$categoria][$nombre] = [];
    }
}

//
function insertar_premio(&$fotografias, $categoria, $seccion, $ruta, $premio){
    $premioFotLst = scandir($ruta.'/'.$premio);
    
    $encontrado = false;
    foreach ($fotografias[$categoria][$seccion] as $clave => $valor) {
        if ($clave == $premio){
            $encontrado = true;
            break;
        }
    }
    if (!$encontrado){
        $fotografias[$categoria][$seccion][$premio] = [];
    }

    for ($c=0; $c < count($premioFotLst); $c++){
        if ($premioFotLst[$c] !== '.' && $premioFotLst[$c] !== '..'){
            $fotografias[$categoria][$seccion][$premio][] = $premioFotLst[$c];
        }
    }
}

/**
 * Class m220211_090136_modelo_de_importacion_fotografias
 */
class m220211_090136_modelo_de_importacion_fotografias extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $ruta = '../web/tmp/concurso/';
        $arrFiles = scandir($ruta);

        //generacion de arbol de fotografias
        $fotografias = [];
        for( $c=0; $c < count($arrFiles); $c++ ){
            if ($arrFiles[$c] !== '.' && $arrFiles[$c] !== '..'){
                $directorio  = explode(' ',$arrFiles[$c]);
                insertar_categoria($fotografias, $directorio[2]);
                insertar_seccion($fotografias, $directorio[2], $directorio[1]);
                
                //se recorren los subdirectorios para obtener los premios
                $subdir = $ruta.$arrFiles[$c];
                $subdirCont = scandir($subdir);
                for ($d=0; $d < count($subdirCont); $d++){
                    if ($subdirCont[$d] !== '.' && $arrFiles[$d] !== '..'){
                        insertar_premio($fotografias, $directorio[2], $directorio[1], $subdir, $subdirCont[$d]);
                    }
                }
            }
        }

        //obtencion de 
        var_dump($fotografias);
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        echo "m220211_090136_modelo_de_importacion_fotografias cannot be reverted.\n";

        return false;
    }

}
