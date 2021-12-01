<?php

namespace app\models;

use Yii;
use yii\web\UploadedFile;

/**
 * This is the model class for table "profile".
 *
 * @property int $id
 * @property string|null $name
 * @property string|null $last_name
 * @property int $fotoclub_id
 *
 * @property Fotoclub $fotoclub
 * @property ProfileContest[] $profileContests
 * @property User[] $users
 */
class Profile extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'profile';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['fotoclub_id'], 'required'],
            [['fotoclub_id'], 'integer'],
            [['name'], 'string', 'max' => 59],
            [['last_name', 'img_url'], 'string', 'max' => 50],
            [['fotoclub_id'], 'exist', 'skipOnError' => true, 'targetClass' => Fotoclub::className(), 'targetAttribute' => ['fotoclub_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'name' => 'Name',
            'last_name' => 'Last Name',
            'fotoclub_id' => 'Fotoclub ID',
        ];
    }

    public function beforeDelete() {
        if (!empty($this->img_url) && file_exists($this->img_url)) {
            unlink($this->img_url);
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
            // $tipo   = $image->type;
            // $tamano = $image->size;
            // $temp   = $image->tempName;
            // validar img
            $date     = new \DateTime();
            $img_name = $this->id . '_' . $date->getTimestamp();
            $full_path = 'images/profile_' . $img_name .  '.' . $image->extension;

            if (!$insert) {
                if (!empty($this->img_url) && file_exists($this->img_url)) {
                    unlink($this->img_url);
                    $this->img_url = '';
                    // echo 'se elimnó la img';
                } else {
                    // echo 'no se elimnó la img';
                }
            }

            $image->saveAs($full_path);
            $this->img_url = $full_path;
        } else {
            // no se cargó la imagen
        }
      
        
      
        return parent::beforeSave($insert);
      
      }
    /**
     * Gets query for [[Fotoclub]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getFotoclub()
    {
        return $this->hasOne(Fotoclub::className(), ['id' => 'fotoclub_id']);
    }

    /**
     * Gets query for [[ProfileContests]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfileContests()
    {
        return $this->hasMany(ProfileContest::className(), ['profile_id' => 'id']);
    }

    /**
     * Gets query for [[Users]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getUsers()
    {
        return $this->hasMany(User::className(), ['profile_id' => 'id']);
    }
    /**
     * Gets query for [[Users]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getUser()
    {
        return $this->hasOne(User::className(), ['profile_id' => 'id']);
    }

    
    /**
     * Gets query for [[Profile]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getuserProfile()
    {
        return $this->hasOne(Profile::className(), ['id' => 'profile_id']);
    }

    public function fields() {
        $fields = parent::fields();

        
        // expand por default
        // unset( $fields['fotoclub_id'],
        //      );
        // $fields[] = 'fotoclub'; 
        // $fields[] = 'user'; 

        return $fields;
    }

    public function extraFields() {
        return [ 'user', 'fotoclub' ];
    }
}
