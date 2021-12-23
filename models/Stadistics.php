<?php

namespace app\models;

use Yii;
use yii\db\Query;
use yii\base\Model;

/**
 * This is the model class for table "contest_category".
 *
 * @property int $contest_id
 * @property int $category_id
 *
 * @property Category $category
 * @property Contest $contest
 */
// class Stadistics extends \yii\base\Model
class Stadistics extends \yii\db\ActiveRecord
{

    public static function model($className=__CLASS__) 
    { 
     return parent::model($className); 
    } 
    
public static function tableName() 
{ 
 return 'stadistics'; 
} 

    public function rules()
    {
        return [
            [['concursos', 'fotografias'], 'integer'],
        ];
    }

    public function attributeLabels()
{
    return [
        'concursos'=> 'Concursos',
        'fotografias' => 'Fotografias'
        
    ];
}

    public function getContests()
    {
        $profileId = Yii::$app->request->get('profile_id');
        //Count(*) from profile_contest pc where (pc.profile_id = profile_id)
        $query = (new Query)->select('COUNT(*)')->from('profile_contest')->where('profile_id=:profile_id');
        $query->addParams([':profile_id'=> $profileId]);

        return $query;
    }

    public function getPhotos(){
        $profileId = Yii::$app->request->get('profile_id');
        //Count(*) from profile_contest pc where (pc.profile_id = profile_id)
        $query = (new Query)->select('COUNT(*)')->from('image')->where('profile_id=:profile_id');
        $query->addParams([':profile_id'=> $profileId]);

        return $query;
    }

/*
-concursos
-fotografias
-1er puesto
-mencion
*/

    public function fields() {
        $fields = parent::fields();
        return $fields;
    }
}
