<?php

namespace app\models;

use Yii;
use yii\web\UploadedFile;
use app\models\Thumbnail;
use app\models\ThumbnailType;
use app\models\ContestResult;
// use yii\helpers\Url;

/**
 * This is the model class for table "image".
 *
 * @property int $id
 * @property string $code
 * @property string $title
 * @property int $profile_id
 *
 * @property ContestResult[] $contestResults
 */
class Image extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'image';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['code', 'title', 'profile_id'], 'required'],
            [['profile_id'], 'integer'],
            [['title', 'url', 'code'], 'string'],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'code' => 'Code',
            'title' => 'Title',
            'profile_id' => 'Profile ID',
            'url' => 'Url'
            // 'image_file' => 'Image File'
        ];
    }

    public function beforeDelete() {
        if (!empty($this->url) && file_exists($this->url)) {
            unlink($this->url);
            // echo 'se elimnó la img';
        }

        //se buscan las miniaturas y se eliminan
        $thumbs = $this->getThumbnail()->all();
        for ($c=0; $c < count($thumbs); $c++ ){
            //var_dump($thumbs[$c]);
            if (!empty($thumbs[$c]->url) && file_exists($thumbs[$c]->url)) {
                unlink($thumbs[$c]->url);
            }

            $thumbs[$c]->delete();
        }

        return true;
    }

    private function base64_to_file($base64_string, $output_file) {
        // open the output file for writing
        $ifp = fopen( $output_file, 'wb' ); 
        $data = explode( ',', $base64_string );
    
        // we could add validation here with ensuring count( $data ) > 1
        fwrite( $ifp, base64_decode( $data[ 1 ] ) );
    
        // clean up the file resource
        fclose( $ifp ); 
    
        return $output_file; 
    }

    public $category = NULL;

    public function regenerateThumbnail( $id ){
        //se buscan las miniaturas y se eliminan
        $thumbs = $this->getThumbnail()->all();
        for ($c=0; $c < count($thumbs); $c++ ){
            var_dump($thumbs[$c]);
            if (!empty($thumbs[$c]->url) && file_exists($thumbs[$c]->url)) {
                unlink($thumbs[$c]->url);
            }

            $thumbs[$c]->delete();
        }

        echo "Regenerar thumbnail ".$this->id." \n";
        
        // Usar URL base configurada para imágenes
        $imageBaseUrl = Yii::$app->params['imageBaseUrl'];
        if (substr($imageBaseUrl, -1) !== '/') $imageBaseUrl .= '/';
        $img_name = $imageBaseUrl . $this->url;
        
        // Obtener ruta de thumbnails según configuración
        $thumbBase = $this->getThumbnailBasePath();
        
        if (!file_exists($thumbBase)) {
            mkdir($thumbBase, 0777, true);
        }
        
        $this->generateThumbnails('', $img_name, $thumbBase);
    }

    public function beforeSave($insert) {
        $params = Yii::$app->getRequest()->getBodyParams();
        
        if (isset($params['photo_base64'])) {
            $date = new \DateTime();
            $extension = 'jpg'; // Forzar JPG para máxima calidad en concursos
            
            // Crear nombre temporal para procesamiento
            $basePath = Yii::$app->params['imageBasePath'];
            if (substr($basePath, -1) !== '/') $basePath .= '/';
            
            // Archivo temporal antes del procesamiento
            $tempPath = $basePath . 'temp_' . $date->getTimestamp() . '.jpg';
            
            // Guardar imagen base64 temporalmente
            $this->base64_to_file($params['photo_base64']['file'], $tempPath);
            
            // Validar imagen para concurso
            $validation = $this->validateImageForContest($tempPath);
            if (!$validation['valid']) {
                // Limpiar archivo temporal
                if (file_exists($tempPath)) {
                    unlink($tempPath);
                }
                throw new \yii\web\BadRequestHttpException($validation['error']);
            }
            
            // Procesar imagen con máxima calidad y redimensionar a 1920px
            $finalPath = $basePath . $date->getTimestamp() . '.jpg';
            
            try {
                $processInfo = $this->processMainImage($tempPath, $finalPath);
                
                // Log detallado del procesamiento para concursos
                $config = $this->getImageQualityConfig();
                if ($config['logging']['log_quality_metrics']) {
                    $logData = [
                        'file' => basename($finalPath),
                        'original' => $validation['info'],
                        'processed' => $processInfo,
                        'timestamp' => $date->format('Y-m-d H:i:s')
                    ];
                    error_log("CONCURSO_IMAGE_PROCESSED: " . json_encode($logData));
                }
                
                // Guardar solo el path relativo (sin imageBasePath)
                $basePath = Yii::$app->params['imageBasePath'];
                if (substr($basePath, -1) !== '/') $basePath .= '/';
                
                if (strpos($finalPath, $basePath) === 0) {
                    $relativePath = substr($finalPath, strlen($basePath));
                } else {
                    $relativePath = $finalPath;
                }
                
                $this->url = $relativePath;
                
                // Eliminar archivo temporal
                if (file_exists($tempPath)) {
                    unlink($tempPath);
                }
                
            } catch (\Exception $e) {
                // Limpiar archivos en caso de error
                if (file_exists($tempPath)) {
                    unlink($tempPath);
                }
                if (file_exists($finalPath)) {
                    unlink($finalPath);
                }
                
                error_log("Error procesando imagen para concurso: " . $e->getMessage());
                throw new \yii\web\ServerErrorHttpException("Error procesando imagen: " . $e->getMessage());
            }
        }

        if ($insert) { // create
            
        } else { // update
            $contest_result = ContestResult::find()->where(['image_id' => $this->id])->one();
            $antValue = self::find()->where(['id'=> $this->id])->one();
            if ($contest_result != NULL){ 
                $date   = new \DateTime();
                $date   = $date->format("Y");
                $seccion = Section::find()->where(['id' => $contest_result->section_id])->one();

                $this->code = rand(1000,9999).'_'.$date.'_'.$contest_result->contest_id.'_'.$seccion->name.'_'.$this->id;
                
                $directory = Yii::$app->params['imageBasePath'];
                if (substr($directory, -1) !== '/') $directory .= '/';
                $directory = rtrim($directory, '/');
                //si ya hay categoria definida, nos aseguramos que exista su correspondiente directorio
                $profile_contest = ProfileContest::find()->where(['profile_id' => $this->profile_id])->one();
                $category = Category::find()->where(['id' => $profile_contest->category_id])->one();
                $this->category = $category->name;
                
                if ($this->category != NULL){
                    $directory .= '/' . $this->category;
                    if (!file_exists($directory)){
                        mkdir($directory, 0777, true);
                    }
                }

                //nos aseguramos de que exista el directorio de la seccion, esto se usa para catalogar las imagenes
                $directory .= '/' . $seccion->name;
                if (!file_exists($directory)){
                    mkdir($directory, 0777, true);
                }
                //nos aseguramos de mantener consistencia entre nombres de archivo y codigo
                if (!empty($this->url) && file_exists($antValue->url)) {
                    $full_path = $directory . '/' . $this->code . '.jpg';
                    rename($antValue->url, $full_path);
                    
                    // Guardar solo el path relativo (sin imageBasePath)
                    $basePath = Yii::$app->params['imageBasePath'];
                    if (substr($basePath, -1) !== '/') $basePath .= '/';
                    
                    if (strpos($full_path, $basePath) === 0) {
                        $relativePath = substr($full_path, strlen($basePath));
                    } else {
                        $relativePath = $full_path;
                    }
                    
                    $this->url = $relativePath;
                }
            }
        }
        return parent::beforeSave($insert);
    }

    public function afterSave($insert, $changedAttributes) {
        $params = Yii::$app->getRequest()->getBodyParams();

        //Generación de miniaturas
        if (isset($params['photo_base64'])) {
            $img_name = $this->url;
            
            // Obtener ruta de thumbnails según configuración
            $thumbBase = $this->getThumbnailBasePath();
            
            if (!file_exists($thumbBase)) {
                mkdir($thumbBase, 0777, true);
            }
            $this->generateThumbnails('', $img_name, $thumbBase);
        }
        return parent::afterSave($insert, $changedAttributes);
    }

    protected function generateThumbnails($d_base, $img_name, $d_thumbnails){
        $config = $this->getImageQualityConfig();
        $thumbConfig = $config['thumbnails'];
        $thumbTypes = ThumbnailType::find()->all();
        
        for ($c = 0; $c < count($thumbTypes); $c++) {
            $imgResult = $this->newResizedImage(
                $img_name,
                $d_base.$img_name,
                $thumbTypes[$c]->width,
                $thumbTypes[$c]->height
            );

            if (!isset($imgResult) || $imgResult === null) {
                error_log('Error en generacion de miniatura: ' . $img_name);
                continue; // Continuar con siguiente thumbnail
            }
            
            $date = new \DateTime();
            $thumbnailPath = $d_thumbnails . $thumbTypes[$c]->width . '_.' . $thumbTypes[$c]->height . '_' . $this->id . '_' . $date->getTimestamp() . '.jpg';
            
            try {
                // Usar calidad configurada para thumbnails
                $success = imagejpeg($imgResult, $thumbnailPath, $thumbConfig['quality']);
                
                if (!$success) {
                    // Intentar crear el directorio si no existe
                    $dir = dirname($thumbnailPath);
                    if (!file_exists($dir)) {
                        mkdir($dir, 0777, true);
                        $success = imagejpeg($imgResult, $thumbnailPath, $thumbConfig['quality']);
                    }
                    
                    // Si sigue fallando, intentar ruta alternativa usando imageBasePath
                    if (!$success) {
                        $basePath = Yii::$app->params['imageBasePath'];
                        if (substr($basePath, -1) !== '/') $basePath .= '/';
                        $altPath = $basePath . 'web/' . basename($thumbnailPath);
                        $success = imagejpeg($imgResult, $altPath, $thumbConfig['quality']);
                        if ($success) {
                            $thumbnailPath = $altPath;
                        }
                    }
                }
                
                if ($success) {
                    // Registrar thumbnail en base de datos
                    $thumb_reg = new Thumbnail();
                    $thumb_reg->image_id = $this->id;
                    
                    // Guardar solo el path relativo (sin imageBasePath)
                    $basePath = Yii::$app->params['imageBasePath'];
                    if (substr($basePath, -1) !== '/') $basePath .= '/';
                    
                    if (strpos($thumbnailPath, $basePath) === 0) {
                        $relativePath = substr($thumbnailPath, strlen($basePath));
                    } else {
                        $relativePath = $thumbnailPath;
                    }
                    
                    $thumb_reg->url = $relativePath;
                    $thumb_reg->thumbnail_type = $thumbTypes[$c]->id;
                    $thumb_reg->save(false);
                    
                    if ($config['logging']['log_processing']) {
                        error_log("Thumbnail generado: {$thumbnailPath} ({$thumbTypes[$c]->width}x{$thumbTypes[$c]->height}) - Calidad: {$thumbConfig['quality']}%");
                    }
                } else {
                    error_log("Error guardando thumbnail: " . $thumbnailPath);
                }
                
            } catch (\Throwable $th) {
                error_log("Excepción generando thumbnail: " . $th->getMessage());
            } finally {
                // Siempre limpiar memoria del recurso de imagen
                imagedestroy($imgResult);
            }
        }
        
        return true;
    }

    /**
     * Gets query for [[ContestResults]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestResults()
    {
        return $this->hasMany(ContestResult::className(), ['image_id' => 'id']);
    }

        /**
     * Gets query for [[Profile]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfile()
    {
        return $this->hasOne(Profile::className(), ['id' => 'profile_id']);
    }

    public function getThumbnail()
    {
        return $this->hasOne(Thumbnail::className(), ['image_id' => 'id']);
    }

    public function extraFields() {
        return [ 'profile', 'thumbnail' ];
    }

    /**
     * Valida imagen antes del procesamiento
     */
    public function validateImageForContest($filePath) {
        $config = $this->getImageQualityConfig();
        $validation = $config['validation'];
        
        // Verificar que el archivo existe
        if (!file_exists($filePath)) {
            return ['valid' => false, 'error' => 'Archivo no encontrado'];
        }
        
        // Verificar tamaño del archivo
        $fileSize = filesize($filePath);
        if ($fileSize > $validation['max_file_size']) {
            $maxSizeMB = round($validation['max_file_size'] / (1024 * 1024), 1);
            return ['valid' => false, 'error' => "Archivo muy grande. Máximo: {$maxSizeMB}MB"];
        }
        
        // Verificar formato
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        if (!in_array($ext, $config['allowed_formats'])) {
            $allowedFormats = implode(', ', $config['allowed_formats']);
            return ['valid' => false, 'error' => "Formato no permitido. Permitidos: {$allowedFormats}"];
        }
        
        // Verificar dimensiones
        $imageInfo = getimagesize($filePath);
        if ($imageInfo === false) {
            return ['valid' => false, 'error' => 'No es una imagen válida'];
        }
        
        list($width, $height) = $imageInfo;
        
        if ($width < $validation['min_width'] || $height < $validation['min_height']) {
            return [
                'valid' => false, 
                'error' => "Imagen muy pequeña. Mínimo: {$validation['min_width']}x{$validation['min_height']}px. Actual: {$width}x{$height}px"
            ];
        }
        
        if ($width > $validation['max_width_original'] || $height > $validation['max_height_original']) {
            return [
                'valid' => false, 
                'error' => "Imagen muy grande. Máximo: {$validation['max_width_original']}x{$validation['max_height_original']}px"
            ];
        }
        
        return [
            'valid' => true,
            'info' => [
                'width' => $width,
                'height' => $height,
                'size' => $fileSize,
                'format' => $ext,
                'mime' => $imageInfo['mime']
            ]
        ];
    }

    /**
     * Configuración de calidad de imagen
     */
    private function getImageQualityConfig() {
        static $config = null;
        if ($config === null) {
            $config = require(Yii::getAlias('@app/config/image_quality.php'));
        }
        return $config;
    }
    
    /**
     * Obtiene la ruta base para thumbnails según la configuración
     */
    public function getThumbnailBasePath() {
        $config = $this->getImageQualityConfig();
        $dirConfig = $config['directories'];
        
        $basePath = Yii::$app->params['imageBasePath'];
        if (substr($basePath, -1) !== '/') $basePath .= '/';
        
        $thumbPath = $basePath . $dirConfig['thumbnail_subdir'];
        
        // Organizar por año si está habilitado
        if ($dirConfig['organize_by_year']) {
            $yearFormat = $dirConfig['year_format'] ?? 'Y';
            $year = date($yearFormat);
            $thumbPath .= $year . '/';
        }
        
        return $thumbPath;
    }
    
    /**
     * Versión estática para obtener ruta de thumbnails sin instancia
     */
    public static function getStaticThumbnailBasePath() {
        $config = require(Yii::getAlias('@app/config/image_quality.php'));
        $dirConfig = $config['directories'];
        
        $basePath = Yii::$app->params['imageBasePath'];
        if (substr($basePath, -1) !== '/') $basePath .= '/';
        
        $thumbPath = $basePath . $dirConfig['thumbnail_subdir'];
        
        // Organizar por año si está habilitado
        if ($dirConfig['organize_by_year']) {
            $yearFormat = $dirConfig['year_format'] ?? 'Y';
            $year = date($yearFormat);
            $thumbPath .= $year . '/';
        }
        
        return $thumbPath;
    }
    
    /**
     * Obtiene la URL completa de la imagen usando la configuración
     */
    public function getImageUrl() {
        if (empty($this->url)) {
            return null;
        }
        
        $imageBaseUrl = Yii::$app->params['imageBaseUrl'];
        if (substr($imageBaseUrl, -1) !== '/') $imageBaseUrl .= '/';
        
        // Si la URL ya contiene el path completo, extraer solo la parte relativa
        $relativePath = $this->url;
        $basePath = Yii::$app->params['imageBasePath'];
        if (strpos($relativePath, $basePath) === 0) {
            $relativePath = substr($relativePath, strlen($basePath));
            if (substr($relativePath, 0, 1) === '/') $relativePath = substr($relativePath, 1);
        }
        
        return $imageBaseUrl . $relativePath;
    }
    
    /**
     * Obtiene la URL completa de un thumbnail específico
     */
    public function getThumbnailUrl($thumbnailType = null) {
        $thumbnail = $this->getThumbnail()->one();
        if (!$thumbnail) {
            return null;
        }
        
        $imageBaseUrl = Yii::$app->params['imageBaseUrl'];
        if (substr($imageBaseUrl, -1) !== '/') $imageBaseUrl .= '/';
        
        // La URL del thumbnail ya es relativa (solo contiene thumbnails/2025/archivo.jpg)
        $relativePath = $thumbnail->url;
        if (substr($relativePath, 0, 1) === '/') {
            $relativePath = substr($relativePath, 1);
        }
        
        return $imageBaseUrl . $relativePath;
    }
    
    /**
     * Procesa imagen principal con máxima calidad
     * Redimensiona a máximo 1920px de ancho manteniendo relación de aspecto
     */
    protected function processMainImage($imgPath, $outputPath) {
        $config = $this->getImageQualityConfig();
        $mainConfig = $config['main_image'];
        
        $ext = strtolower(pathinfo($imgPath, PATHINFO_EXTENSION));
        
        // Validar formato
        if (!in_array($ext, $config['allowed_formats'])) {
            throw new \Exception("Formato de imagen no permitido: " . $ext);
        }
        
        // Configurar memoria para procesamiento
        ini_set('memory_limit', $config['memory_settings']['memory_limit']);
        set_time_limit($config['memory_settings']['max_execution_time']);
        
        // Crear imagen desde archivo
        $imagen = $this->createImageFromFile($imgPath, $ext);
        if ($imagen === null) {
            throw new \Exception("No se pudo cargar la imagen: " . $imgPath);
        }
        
        $originalWidth = imagesx($imagen);
        $originalHeight = imagesy($imagen);
        
        // Validar dimensiones mínimas para concursos
        $validation = $config['validation'];
        if ($originalWidth < $validation['min_width'] || $originalHeight < $validation['min_height']) {
            imagedestroy($imagen);
            throw new \Exception("Imagen muy pequeña. Mínimo: {$validation['min_width']}x{$validation['min_height']}px");
        }
        
        // Calcular nuevas dimensiones
        $maxWidth = $mainConfig['max_width'];
        $quality = $mainConfig['quality'];
        
        if ($originalWidth > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = intval(($originalHeight * $maxWidth) / $originalWidth);
        } else {
            // Mantener tamaño original si es menor al máximo
            $newWidth = $originalWidth;
            $newHeight = $originalHeight;
        }
        
        // Crear imagen redimensionada con máxima calidad
        $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
        
        // Configurar para mejor calidad
        imagealphablending($resizedImage, false);
        imagesavealpha($resizedImage, true);
        
        // Usar imagecopyresampled para mejor calidad que imagecopyresized
        imagecopyresampled(
            $resizedImage, $imagen,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $originalWidth, $originalHeight
        );
        
        // Guardar con máxima calidad JPEG
        $success = imagejpeg($resizedImage, $outputPath, $quality);
        
        // Limpiar memoria
        imagedestroy($imagen);
        imagedestroy($resizedImage);
        
        if (!$success) {
            throw new \Exception("Error al guardar la imagen procesada: " . $outputPath);
        }
        
        // Log del procesamiento si está habilitado
        if ($config['logging']['log_processing']) {
            $logMessage = "Imagen concurso procesada: {$outputPath} | " .
                         "Original: {$originalWidth}x{$originalHeight} | " .
                         "Final: {$newWidth}x{$newHeight} | " .
                         "Calidad: {$quality}%";
            error_log($logMessage);
        }
        
        return [
            'width' => $newWidth,
            'height' => $newHeight,
            'original_width' => $originalWidth,
            'original_height' => $originalHeight,
            'quality' => $quality,
            'file_size' => filesize($outputPath),
            'format' => 'jpg'
        ];
    }
    
    /**
     * Crea recurso de imagen desde archivo
     */
    private function createImageFromFile($imgPath, $ext) {
        try {
            switch($ext) {
                case 'jpg':
                case 'jpeg':
                case 'jpe':
                    return imagecreatefromjpeg($imgPath);
                case 'png':
                    return imagecreatefrompng($imgPath);
                case 'gif':
                    return imagecreatefromgif($imgPath);
                case 'webp':
                    return imagecreatefromwebp($imgPath);
                default:
                    return null;
            }
        } catch (\Throwable $th) {
            error_log("Error cargando imagen {$imgPath}: " . $th->getMessage());
            return null;
        }
    }

    /**
     * Método mejorado para thumbnails con mejor calidad
     */
    protected function newResizedImage($imgName, $imgPath, $xmax, $ymax){
        $ext = strtolower(pathinfo($imgName, PATHINFO_EXTENSION));
        
        $imagen = $this->createImageFromFile($imgPath, $ext);
        if ($imagen === null) {
            return null;
        }

        $x = imagesx($imagen);
        $y = imagesy($imagen);

        // Si ya está dentro de los límites, retornar original
        if($x <= $xmax && $y <= $ymax){
            return $imagen;
        }

        // Calcular nuevas dimensiones manteniendo aspecto
        if($x >= $y) {
            $nuevax = $xmax;
            $nuevay = intval(($nuevax * $y) / $x);
        } else {
            $nuevay = $ymax;
            $nuevax = intval(($x / $y) * $nuevay);
        }

        // Crear imagen redimensionada con mejor calidad
        $img2 = imagecreatetruecolor($nuevax, $nuevay);
        
        // Configurar para mejor calidad
        imagealphablending($img2, false);
        imagesavealpha($img2, true);
        
        // Usar imagecopyresampled para mejor calidad
        imagecopyresampled($img2, $imagen, 0, 0, 0, 0, $nuevax, $nuevay, $x, $y);
        
        // Limpiar memoria de imagen original
        imagedestroy($imagen);
        
        return $img2;
    }
}
