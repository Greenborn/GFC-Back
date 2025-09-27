<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\ContestResult;
use app\models\ProfileContest;
use app\models\Contest;
use app\models\Metric;

const BASE_URL    = 'https://gfc.prod-api.greenborn.com.ar/';
const RUTA_ARCHIVO = './informe_concurso_';

function formatear_dni($dni){
    if ($dni == null || $dni == "") {
        return "";
    }

    $dni = str_replace($dni, '.', '');

    return  number_format(intval($dni), 0, "", ".");
}

function rrmdir($dir) { 
    if (is_dir($dir)) { 
      $objects = scandir($dir);
      foreach ($objects as $object) { 
        if ($object != "." && $object != "..") { 
          if (is_dir($dir. DIRECTORY_SEPARATOR .$object) && !is_link($dir."/".$object))
            rrmdir($dir. DIRECTORY_SEPARATOR .$object);
          else
            unlink($dir. DIRECTORY_SEPARATOR .$object); 
        } 
      }
      rmdir($dir); 
    } 
 }

class InformesController extends Controller
{
    public function actionCantidadConcursantes($concurso)
    {
        $resultados = ContestResult::find()
            ->where(['contest_id' => $concurso])->all();
        $contest = Contest::findOne($concurso);

        $informe = [
            "cant_total_obras" => 0,
            "cant_total_concursantes" => 0,
            "cant_total_organizaciones" => 0,
            "organizaciones" => [],
            "secciones" => [],
            "concursantes" => []
        ];

        $secciones = [];

        foreach ($resultados as $key => $resultado_) {
            $informe["cant_total_obras"] ++;
            
            //ORGANIZACIONES
            $organizacion = isset($resultado_->image->profile->fotoclub->name) ? $resultado_->image->profile->fotoclub->name : "";
            if ( !isset($informe["organizaciones"][$organizacion]) ) {
                $informe["organizaciones"][$organizacion] = [
                    "cant_total_obras" => 0,
                    "concursantes" => [],
                    "cant_total_concursantes" => 0
                ];
                $informe["cant_total_organizaciones"] ++;
            }

            $informe["organizaciones"][$organizacion]["cant_total_obras"] ++;

            //SECCIONES
            $seccion = $resultado_->section->name;
            if (!isset($informe["organizaciones"][$organizacion][$seccion])){
                $informe["organizaciones"][$organizacion][$seccion] = [
                    "cant_total_obras" => 0,
                    "cant_total_concursantes" => 0,
                    "obras" => [],
                    "concursantes" => []
                ];
            }
            $informe["organizaciones"][$organizacion][$seccion]["cant_total_obras"] ++;

            if (!isset($secciones[$seccion])){
                $secciones[$seccion] = true;
            }

            //OBRAS
            $informe["organizaciones"][$organizacion][$seccion]["obras"][] = [
                "Autor" => [ 
                    "Nombre" => $resultado_->image->profile->name,
                    "DNI"    => formatear_dni($resultado_->image->profile->user->dni)
                ],
                "Titulo" => $resultado_->image->title,
                "URL" => BASE_URL.urlencode($resultado_->image->url),
                "Cod" => $resultado_->image->code,
            ];

            //CONCURSANTES
            if (!isset($informe["concursantes"][$resultado_->image->profile->id])){
                $informe["concursantes"][$resultado_->image->profile->id] = [ 
                    "Nombre" => $resultado_->image->profile->name,
                    "DNI"    => formatear_dni($resultado_->image->profile->user->dni)
                ];
                $informe["cant_total_concursantes"] ++;
            }

            if (!isset($informe["organizaciones"][$organizacion]["concursantes"][$resultado_->image->profile->id])){
                $informe["organizaciones"][$organizacion]["concursantes"][$resultado_->image->profile->id] = [ 
                    "Nombre" => $resultado_->image->profile->name,
                    "DNI"    => $resultado_->image->profile->user->dni
                ];
                $informe["organizaciones"][$organizacion]["cant_total_concursantes"] ++;
            }

            if (!isset($informe["organizaciones"][$organizacion][$seccion]["concursantes"][$resultado_->image->profile->id])){
                $informe["organizaciones"][$organizacion][$seccion]["concursantes"][$resultado_->image->profile->id] = [ 
                    "Nombre" => $resultado_->image->profile->name,
                    "DNI"    => formatear_dni($resultado_->image->profile->user->dni)
                ];
                $informe["organizaciones"][$organizacion][$seccion]["cant_total_concursantes"] ++;
            }

            //SECCIONES
            if (!isset($informe["secciones"][$seccion])){
                $informe["secciones"][$seccion] = [
                    "cant_total_obras" => 0
                ];
            }
            $informe["secciones"][$seccion]["cant_total_obras"] ++;
            
        }

        //Se guarda informe en formato JSON
        $file_name = RUTA_ARCHIVO.$concurso.".json";
        file_put_contents($file_name, json_encode($informe));

        if (file_exists($file_name)) {
            echo 'Archivo guardado con éxito';
        } else {
            echo 'Error al guardar el archivo';
        }

        //Se genera HTML
        $HTML = '<!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
                    <title>Informe Concurso '.$contest->name.'</title>
                    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
                    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
                </head>
                <body>
                <div class="container">';

        $HTML .= '<header class="bg-primary text-white text-center p-5"><h1 class="display-5"> '.$contest->name.'</h1></header>';


        $HTML .= '<div class="row text-center"><div class="col">
                    <table class="table table-striped">
                    <tr>
                        <th>Cantidad Total Concursantes</th>
                        <th>Cantidad Total Obras</th>
                        <th>Cantidad Total Fotoclubes/Agrupaciónes/Instituciones</th>
                    </tr>
                    <tr>
                        <td>'.$informe["cant_total_concursantes"].'</td>
                        <td>'.$informe["cant_total_obras"].'</td>
                        <td>'.$informe["cant_total_organizaciones"].'</td>
                    </tr>
                </table></div></div>';

        $HTML .= '<div class="row text-center mb-5"><div class="col"><h2> Por Fotoclub/Agrupación/Institucion </h2></div></div>';

        foreach ($informe["organizaciones"] as $key => $value){
            $organizacion_ = $value;

            $HTML .= '
                        <header class="bg-primary text-white text-center">
                            <h3 class="mt-5 mb-3">' . $key . '</h3>
                        </header>
                        ';

            $HTML .= '<div class="row text-center mb-5">
                        <div class="col">
                            <h4>General</h4>
                        </div>
                    </div>';

            $HTML .= '<table class="table table-striped">
                        <tr>
                            <th>Cantidad Total Concursantes</th>
                            <th>Cantidad Total Obras</th>
                        </tr>
                        <tr>
                            <td>'.$organizacion_["cant_total_concursantes"].'</td>
                            <td>'.$organizacion_["cant_total_obras"].'</td>
                        </tr>
                    </table>';

            foreach ($secciones as $key => $value){
                $HTML .= '<div class="row text-center mb-5">
                        <div class="col">
                            <h4>'.$key.'</h4>
                        </div>
                    </div>';
                
                $seccion_ = $organizacion_[$key];

                $HTML .= '<table class="table table-striped">
                        <tr>
                            <th>Cantidad Total Concursantes</th>
                            <th>Cantidad Total Obras</th>
                        </tr>
                        <tr>
                            <td>'.$seccion_["cant_total_concursantes"].'</td>
                            <td>'.$seccion_["cant_total_obras"].'</td>
                        </tr>
                    </table>';

            }
               
        }

        $HTML .= "</div></body></html>";

        $file_name = RUTA_ARCHIVO.$concurso.".html";
        file_put_contents($file_name, $HTML);

        if (file_exists($file_name)) {
            echo 'Archivo guardado con éxito';
        } else {
            echo 'Error al guardar el archivo';
        }

        echo "\n";

    }

    private function getResultadosConcurso( $id_concurso, $prefijo_archivo ){
        $resultados = ContestResult::find()
            ->where(['contest_id' => $id_concurso])->all();
        $contest = Contest::findOne($id_concurso);

        $csv = "Premio; Apellido y Nombre; Nombre de Usuario; E-Mail; Categoria; Sección\n"; 

        
        foreach ($resultados as $key => $resultado_) {
            $profile   = $resultado_->image->profile;
            $user      = $profile->user;
            
            $nombre_completo = $profile->last_name." ".$profile->name;
            $metric = Metric::find()->where(['id' => $resultado_->metric_id])->one();
            $categoria = ProfileContest::find()->where(['contest_id' => $id_concurso, 'profile_id' => $resultado_->image->profile->id ])->one()->category->name;
            $csv       .= $metric->prize."; ".$nombre_completo.";".$user->username."; ".$user->email."; ".$categoria."; ".$resultado_->section->name."\n";
        }
        file_put_contents("./resultados/".$prefijo_archivo."_".str_replace(' ', '_', preg_replace("/[^A-Za-z0-9 ]/", '', $contest->name) ).".csv", $csv);
        var_dump($csv);
    }

    public function actionParticipantesConcurso($id_concurso){
        if (file_exists("./resultados"))
            rrmdir("./resultados");
        
        mkdir("./resultados");
        $this->getResultadosConcurso($id_concurso, "resultados");
    }

    public function actionResultadosTemporada(){
        $comienzo_temporada = strtotime('first day of January', time());

        $concursos_pasados = Contest::find()
            ->where([ '>', 'end_date', date('d-m-Y', $comienzo_temporada) ])
            ->andWhere([ '=', 'organization_type', 'INTERNO' ])
            ->all();

        if (file_exists("./resultados"))
            rrmdir("./resultados");
        
        
        mkdir("./resultados");
        for ($c = 0; $c < count($concursos_pasados); $c++){
            $this->getResultadosConcurso($concursos_pasados[$c]->id, "resultados");
        }

    }
}