<?php

namespace app\models;

use Yii;
use yii\web\UploadedFile;
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
            [['code'], 'string', 'max' => 20],
            [['title', 'url'], 'string', 'max' => 45],
            // [['image_file'], 'file', 'skipOnEmpty' => false, 'extensions' => 'png, jpg']
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
        return true;
    }

    public function beforeSave($insert) {

  

        // do transformations here

        // if ($insert) { // create
        // } else { // update
        // }
        $params = Yii::$app->getRequest()->getBodyParams();
        
        // $image = $_FILES['image_file'];
        $image = UploadedFile::getInstanceByName('image_file');
        // var_dump($_FILES);

        if (isset($image)) {
            // cargar img y sobrescribir la url
            
            // $tipo   = $image['type'];
            // $tamano = $image['size'];
            // $temp   = $image['tmp_name'];
            // var_dump('si');
            // $tipo   = $image->type;
            // $tamano = $image->size;
            // $temp   = $image->tempName;
            // validar img
            $date     = new \DateTime();
            // $img_name = $date->getTimestamp() . $image['name'];
            $img_name = $this->code . $date->getTimestamp();
            //Si la imagen es correcta en tamaño y tipo
            //Se intenta subir al servidor
            // $full_path = getcwd().'/user_data/'.$img_name;
            $full_path = 'images/' . $img_name .  '.' . $image->extension;
            // $full_path = 'images/' . $img_name;
            // $this->url = $full_path;

            if (!$insert) {
                if (!empty($this->url) && file_exists($this->url)) {
                    unlink($this->url);
                    $this->url = '';
                    // echo 'se elimnó la img';
                } else {
                    // echo 'no se elimnó la img';
                }
            }

            
            // try {
                // if (move_uploaded_file($temp, $full_path)) {
                $image->saveAs($full_path);
                $this->url = $full_path;

                // } else {
                    // $this->url = 'error en la carga';
                // }

                // if (!$insert) $insert = true;
        } else {
            // no se cargó la imagen
            // if ($insert)
            //     $this->url = 'no se cargó la img';
            // else
            //     $this->url ='no era inesrt';
        }
      
        
      
        return parent::beforeSave($insert);
      
      }



    // public function upload()
    // {
    //     if ($this->validate()) {
    //         $this->image_file->saveAs('uploads/' . $this->image_file->baseName . '.' . $this->image_file->extension);
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

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

    public function extraFields() {
        return [ 'profile' ];
    }
}
