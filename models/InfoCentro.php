<?php

namespace app\models;

use Yii;
use yii\web\UploadedFile;


class InfoCentro extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'info_centro';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['content'], 'string'],
            [['title'], 'string', 'max' => 200],
            [['img_url'], 'string', 'max' => 45],
        ];
    }

    /**
     * {@inheritdoc}
     */
    // public function attributeLabels()
    // {
    //     return [
    //         'id' => 'ID',
    //         'title' => 'Title',
    //         'content' => 'Content'
    //     ];
    // }

    public function beforeDelete() {
        if (!empty($this->img_url) && file_exists($this->img_url)) {
            unlink($this->img_url);
            // echo 'se elimnó la img';
        }
        return true;
    }

    public function beforeSave($insert) {

        $params = Yii::$app->getRequest()->getBodyParams();
        
        $image = UploadedFile::getInstanceByName('image_file');

        if (isset($image)) {
            $date     = new \DateTime();
            $img_name = $this->id . '_' . $date->getTimestamp();
            $full_path = 'images/info-centro_' . $img_name .  '.' . $image->extension;

            if (!$insert) {
                if (!empty($this->img_url) && file_exists($this->img_url)) {
                    unlink($this->img_url);
                    $this->img_url = '';
                } else {}
            }

            $image->saveAs($full_path);
            $this->img_url = $full_path;
        } else {
            // no se cargó la imagen
        }
      
        
      
        return parent::beforeSave($insert);
      
      }

}
