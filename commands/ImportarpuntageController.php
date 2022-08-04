<?php
/**
 * @link http://www.yiiframework.com/
 * @copyright Copyright (c) 2008 Yii Software LLC
 * @license http://www.yiiframework.com/license/
 */

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\Image;
use app\models\Category;
use app\models\Metric;
use app\models\MetricAbm;
use app\models\ContestResult;
//
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

//
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
 * This command echoes the first argument that you have entered.
 *
 * This command is provided as an example for you to learn how to create console commands.
 *
 * @author Qiang Xue <qiang.xue@gmail.com>
 * @since 2.0
 */
class ImportarpuntageController extends Controller
{
    /**
     * This command echoes what you have entered as the message.
     * @param string $message the message to be echoed.
     * @return int Exit code
     */
    public function actionIndex($message = 'hello world')
    {
        $ruta = '/var/www/gfc.prod-api.greenborn.com.ar/web/tmp/concurso/';
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
        foreach ($fotografias as $categoria => $data_cat) {
            foreach ($fotografias[$categoria] as $seccion => $data_secc) {
                foreach ($fotografias[$categoria][$seccion] as $premio => $data_premio) {
                    foreach ($fotografias[$categoria][$seccion][$premio] as $foto_i => $data_foto) {
                        $puntage = MetricAbm::find()->where(['prize' => $premio])->one();
                        $code    = explode('.jpg',$data_foto)[0];
                        $image   = Image::find()->where(['code' => $code])->one();
                        if ($image != NULL){
                            $contest_result = ContestResult::find()->where(['image_id' => $image->id])->one();
                            $metric = Metric::find()->where(['id' => $contest_result->metric_id])->one();
                            if ($metric == null){
                                echo 'error metric null , code '.$code.' metrica n '.$contest_result->metric_id.' premio '.$premio.' puntage '.$puntage->score;
                            }
                            $metric->prize = $premio;
                            $metric->score = $puntage->score;
                            if($metric->save(false)){
                                echo 'procesada, imagen: '.$code.' premio '.$premio. ' puntage '.$puntage->score.' | ';
                            }
                        }
                    }
                }    
            }    
        }

        return ExitCode::OK;
    }
}
