<?php
namespace app\actions;

use Yii;
use yii\rest\ViewAction;

use app\models\ContestResult;
use app\models\Contest;
use app\models\ProfileContest;
use app\models\MetricAbm;
use app\utils\LogManager;

class CompressedPhotosGetAction extends ViewAction {

    private $basePath;
    private $runtimeDir  = 'runtime/';
    private $tempDir     = 'tmp/';
    private $exportDir   = 'exportacion/';
    private $webDir      = 'web/';

    public function __construct($id, $controller, $config = []) {
        parent::__construct($id, $controller, $config);
        $this->basePath = Yii::$app->params['imageBasePath'];
    }

    private function getTempPath() {
        return $this->basePath . $this->runtimeDir . $this->tempDir;
    }

    private function getWebPath() {
        return $this->basePath . $this->webDir;
    }

    private function getLogsPath() {
        return $this->basePath . $this->runtimeDir;
    }

    public function run($id) {
        $params = Yii::$app->getRequest()->getBodyParams();

        $response = Yii::$app->getResponse();
        $response->format = \yii\web\Response::FORMAT_JSON;

        $response->data = [
            'status' => true,
            'download_url' => $this->photo_export($id),
        ];
    }

    private function execCmd($cmd){
        $output_cmd = null;
        exec($cmd, $output_cmd);
        LogManager::toLog(['cmd' => $cmd, 'out' => $output_cmd], 'CompressedPhotosGetAction');
    }

    private function createDirIfnotExists($dir){
        if (!file_exists($dir)){
            $res_dir = mkdir($dir, 0777, true);
            LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.$dir, 'CompressedPhotosGetAction');
        }
    }

    public function photo_export($concurso) {

        $contest  = Contest::findOne(['id' => $concurso]);
        $tipo_org = $contest->organization_type;
        $resultadoConcurso = ContestResult::find()->where(['contest_id' => $concurso])->joinWith('image')->orderBy(['code' => SORT_ASC])->all();

        LogManager::toLog('Iniciando Exportación', 'CompressedPhotosGetAction');

        $tempPath = $this->getTempPath();
        $exportDir = $this->exportDir;
        $webPath = $this->getWebPath();

        chdir($tempPath);
        if (file_exists($exportDir)){
            $this->execCmd('rm -rf '.$exportDir);
        }

        $this->createDirIfnotExists($exportDir);

        $metrics = MetricAbm::find()->where(["organization_type" => $tipo_org])->all();

        if ($tipo_org == 'EXTERNO_UNICEN'){
            $this->createDirIfnotExists($tempPath.$exportDir.'/seleccionada');
        }

        for ($c=0; $c < count($resultadoConcurso); $c++){
            $resultado_ = $resultadoConcurso[$c];
            $seccion    = $resultado_->section->name;

            // INTERNO y EXTERNO_0
            if ($tipo_org == 'INTERNO' || $tipo_org == 'EXTERNO_0'){
                $categoria_path = preg_replace("/[^A-Za-z0-9 ]/", '', ProfileContest::find()->where(['contest_id' => $concurso, 'profile_id' => $resultado_->image->profile->id ])->one()->category->name );

                $this->createDirIfnotExists($tempPath.$exportDir.$categoria_path);
                $this->createDirIfnotExists($tempPath.$exportDir.$categoria_path.'/'.$seccion);

                for ($i=0; $i < count($metrics); $i++){
                    $path = $tempPath.$exportDir.$categoria_path.'/'.$seccion.'/'.$metrics[$i]->prize;
                    $this->createDirIfnotExists($path);
                }

                try {
                    $origen  = $webPath.$resultado_->image->url;
                    $destino = $tempPath.$exportDir.$categoria_path.'/'.$seccion.'/'.$resultado_->image->code.".jpg";
                    $res_copy = copy($origen, $destino);
                    LogManager::toLog('Copiando '.($res_copy ? 'true': 'false').' : '.$origen.' > '.$destino, 'CompressedPhotosGetAction');
                } catch (\Throwable $th) {
                    //throw $th;
                }

            // EXTERNO_UNICEN
            } else if ($tipo_org == 'EXTERNO_UNICEN'){
                $organization = $resultado_->image->profile->fotoclub->name;

                $this->createDirIfnotExists($tempPath.$exportDir.$organization.'/seleccionada');

                $directorio = $tempPath.$exportDir.$organization.'/'.$seccion;
                $this->createDirIfnotExists($directorio);
                $this->createDirIfnotExists($tempPath.$exportDir.'/seleccionada');
                $this->createDirIfnotExists($directorio.'/seleccionada');

                $origen  = $webPath.$resultado_->image->url;
                $destino = $directorio.'/'.$resultado_->image->code.".jpg";
                $res_copy = copy($origen, $destino);
                LogManager::toLog('Copiando '.($res_copy ? 'true': 'false').' : '.$origen.' > '.$destino, 'CompressedPhotosGetAction');
            }
        }
        $arch_zip = 'concurso_'.$concurso.'.zip';

        chdir($tempPath);

        $this->execCmd('zip -r '.$arch_zip.' exportacion');

        $this->execCmd('mv '.$arch_zip.' '.$webPath.$arch_zip);

        LogManager::toLog('Exportación finalizada', 'CompressedPhotosGetAction');
        return 'concurso_'.$concurso.'.zip';
    }
}
