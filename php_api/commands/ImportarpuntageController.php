<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\Image;
use app\models\Category;
use app\models\Metric;
use app\models\MetricAbm;
use app\models\ContestResult;
use app\models\Contest;

use app\commands\ResultadosController;

$informe = [
    "no_encontradas" => [
        "metric" => [],
        "image"  => [],
    ],
    "procesadas" => []
];
const RUTA_INFORME = './informe_importacion_concurso_';
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

function asignar_puntaje($image, $WON_PRIZE, $WON_SCORE){
    if ($image != NULL){
        $contest_result = ContestResult::find()->where(['image_id' => $image->id])->one();
        $metric = Metric::find()->where(['id' => $contest_result->metric_id])->one();
        if ($metric == null){
            echo 'error metric null , code '.$image->$code.' metrica n '.$contest_result->metric_id.' premio '.$WON_PRIZE.' puntage '.$WON_SCORE."\n";
            $informe["no_encontradas"]["metric"][] = $contest_result->metric_id;
        }
        $metric->prize = $WON_PRIZE;
        $metric->score = $WON_SCORE;
        if($metric->save(false)){
            echo 'procesada, imagen: '.$image->code.' premio '.$WON_PRIZE. ' puntage '.$WON_SCORE.' | '."\n";
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

const UNICEN_WON_PRIZE = 'MENCION ESPECIAL';
const UNICEN_WON_SCORE = 13;

const UNICEN_FACULTAD_WON_PRIZE = 'MENCION';
const UNICEN_FACULTAD_WON_SCORE = 8;

const UNICEN_FACULTAD_PARTICIPA_PRIZE = 'PARTICIPACION';
const UNICEN_FACULTAD_PARTICIPA_SCORE = 0.5;

function reemplazo_code($code){
    return str_replace(['Copia de '], '', $code);
}

class ImportarpuntageController extends Controller
{
    public function actionIndex()
    {
        $ruta = '/var/www/gfc.prod-api.greenborn.com.ar/web/tmp/concurso/';
        $arrFiles = scandir($ruta);

        //generacion de arbol de fotografias
        $fotografias = [];
        for( $c=0; $c < count($arrFiles); $c++ ){
            if ($arrFiles[$c] !== '.' && $arrFiles[$c] !== '..'){

                $categoria_path = $arrFiles[$c];
                insertar_categoria($fotografias, $categoria_path);

                $section_path = $ruta.$categoria_path;
                $section_subdirs = scandir($section_path);

                for ($i = 0;$i < count($section_subdirs); $i++){
                    if ($section_subdirs[$i] && $section_subdirs[$i] !== '.' && $section_subdirs[$i] !== '..'){
                        insertar_seccion($fotografias, $categoria_path, $section_subdirs[$i]);

                        //se recorren los subdirectorios para obtener los premios
                        $prizes_base_path = $section_path.'/'.$section_subdirs[$i];
                        $prizes_subdir = scandir($prizes_base_path);
                        for ($j = 0; $j < count($prizes_subdir); $j++){
                            if ($prizes_subdir[$j] !== '.' && $prizes_subdir[$j] !== '..'){
                                insertar_premio($fotografias, $categoria_path, $section_subdirs[$i], $prizes_base_path, $prizes_subdir[$j]);
                            }
                        }
                    }
                }

            }
        }

        //obtencion de 
        $contest_id = "";
        $cant_img = 0;
        $cant_contest_result = 0;
        $cant_no_encontrada = 0;
        foreach ($fotografias as $categoria => $data_cat) {
            foreach ($fotografias[$categoria] as $seccion => $data_secc) {
                foreach ($fotografias[$categoria][$seccion] as $premio => $data_premio) {
                    foreach ($fotografias[$categoria][$seccion][$premio] as $foto_i => $data_foto) {
                        $code    = reemplazo_code(explode('.jpg',$data_foto)[0]);
                        $image   = Image::find()->where(['code' => $code])->one();
                        if ($image != NULL){
                            $cant_contest_result++;
                            $contest_result = ContestResult::find()->where(['image_id' => $image->id])->one();
                            $contest_id = $contest_result->contest_id;
                            $contest = Contest::find()->where(['id' => $contest_id])->one();
                            $puntage = MetricAbm::find()->where(['prize' => $premio, 'organization_type' => $contest->organization_type])->one();
                            $metric = Metric::find()->where(['id' => $contest_result->metric_id])->one();
                            if ($metric == null){
                                echo 'error metric null , code '.$code.' metrica n '.$contest_result->metric_id.' premio '.$premio.' puntage '.$puntage->score."\n";
                            }
                            
                            $metric->prize = $premio;
                            $metric->score = $puntage->score;
                            if($metric->save(false)){
                                $cant_img ++;
                                $informe["procesadas"][] = [$code, $premio, $seccion, $categoria, $puntage->score];
                                echo 'procesada, imagen: '.$code.' premio '.$premio. ' puntage '.$puntage->score.' |'."\n";
                            }
                        } else {
                            $cant_no_encontrada++;
                            $informe['no_encontradas']["image"][] = [$code, $premio, $seccion, $categoria];
                            echo 'error image null , code '.$code.' '.$premio.' '.$seccion." ".$categoria."\n";
                        }
                    }
                }    
            }    
        }

        //Se modifica estado de juzgamiento de concurso
        $contest = Contest::find()->where(['id' => $contest_id])->one();
        $contest->judged = true;
        $contest->save(false);

        echo "ContestsResults ".$cant_contest_result."\n";
        echo "CANTIDAD imagenes no encontradas: ".$cant_no_encontrada."\n";
        echo "CANTIDAD DE IMAGENES PROCESADAS: ".$cant_img."\n";

        //Se guarda informe en formato JSON
        $file_name = RUTA_INFORME.$contest_id.".json";
        file_put_contents($file_name, json_encode($informe));

        if (file_exists($file_name)) {
            echo 'Archivo guardado con éxito';
        } else {
            echo 'Error al guardar el archivo';
        }

        ResultadosController::refreshCacheContest($contest_id);
        return ExitCode::OK;
    }

    public function actionUnicen(){
        $ruta = '/var/www/gfc.prod-api.greenborn.com.ar/web/tmp/concurso/';
        $arrFiles = scandir($ruta);

        //generacion de arbol de fotografias
        $resultados = [];

        for( $c=0; $c < count($arrFiles); $c++ ){
            if ($arrFiles[$c] !== '.' && $arrFiles[$c] !== '..' && $arrFiles[$c] !== 'seleccionada'){
                $institucion_name  = $arrFiles[$c];
                $institucion_path  = $ruta.$institucion_name;
                $institucion_sub_d = scandir($institucion_path);
                $resultados[$institucion_name] = [];

                for ($i = 0;$i < count($institucion_sub_d); $i++){
                    $seccion_name = $institucion_sub_d[$i];

                    if ($seccion_name !== '.' && $seccion_name !== '..' && $seccion_name !== 'seleccionada'){
                        $resultados[$institucion_name][$seccion_name] = [];
                        $obras_presentadas = scandir($institucion_path.'/'.$seccion_name);

                        for ($j = 0; $j < count($obras_presentadas); $j++){
                            $obra = $obras_presentadas[$j];
                            if ($obra !== '.' && $obra !== '..' && $obra !== 'seleccionada'){
                                $code  = explode('.jpg',$obra)[0];
                                $image = Image::find()->where(['code' => $code])->one();
                                $resultados[$institucion_name][$seccion_name]["participacion"][] = $image;

                                asignar_puntaje($image, UNICEN_FACULTAD_PARTICIPA_PRIZE, UNICEN_FACULTAD_PARTICIPA_SCORE);
                            } else if ($obra == 'seleccionada'){
                                $ganadora_institucion_seccion = scandir($institucion_path.'/'.$seccion_name.'/seleccionada');
                                $ganadora_institucion_seccion = array_values(array_filter($ganadora_institucion_seccion, function($item) {
                                                                    return $item !== "." && $item !== "..";
                                                                }));

                                for ($k = 0; $k < count($ganadora_institucion_seccion); $k++){
                                    $code  = explode('.jpg',$ganadora_institucion_seccion[$k])[0];
                                    $image = Image::find()->where(['code' => $code])->one();
                                    $resultados[$institucion_name][$seccion_name]["ganadora"][] = $image;

                                    asignar_puntaje($image, UNICEN_FACULTAD_WON_PRIZE, UNICEN_FACULTAD_WON_SCORE);
                                }
                            }
                        }
                    }

                }
                
// GANADORAS GRAL
            } else if ($arrFiles[$c] == 'seleccionada') {
                $ganadoras_gral = scandir($ruta.'seleccionada');
                $ganadoras_gral = array_values(array_filter($ganadoras_gral, function($item) {
                    return $item !== "." && $item !== "..";
                }));

                for ($i = 0; $i < count($ganadoras_gral); $i++){
                    $code  = explode('.jpg',$ganadoras_gral[$i])[0];
                    $image = Image::find()->where(['code' => $code])->one();

                    $resultados["ganadoras_gral"][] = $image;
                    asignar_puntaje($image, UNICEN_WON_PRIZE, UNICEN_WON_SCORE);
                }
            }
        }

        //var_dump($resultados);
    }
}
