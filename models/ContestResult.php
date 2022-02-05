<?php

namespace app\models;

use Yii;
use app\models\Image;
use app\models\Section;
use app\models\ProfileContest;
use app\models\User;
use app\models\Category;
/**
 * This is the model class for table "contest_result".
 *
 * @property int $id
 * @property int $metric_id
 * @property int $image_id
 * @property int $contest_id
 * @property int $section_id
 * 
 * @property Contest $contest
 * @property Image $image
 * @property Metric $metric
 * @property Section $section
 */
class ContestResult extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'contest_result';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['metric_id', 'image_id', 'contest_id', 'section_id'], 'required'],
            [['metric_id', 'image_id', 'contest_id', 'section_id'], 'integer'],
            [['contest_id'], 'exist', 'skipOnError' => true, 'targetClass' => Contest::class, 'targetAttribute' => ['contest_id' => 'id']],
            [['image_id'], 'exist', 'skipOnError' => true, 'targetClass' => Image::class, 'targetAttribute' => ['image_id' => 'id']],
            [['metric_id'], 'exist', 'skipOnError' => true, 'targetClass' => Metric::class, 'targetAttribute' => ['metric_id' => 'id']],
            [['section_id'], 'exist', 'skipOnError' => true, 'targetClass' => Section::class, 'targetAttribute' => ['section_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'metric_id' => 'Metric ID',
            'image_id' => 'Image ID',
            'contest_id' => 'Contest ID',
            'section_id' => 'Section ID',
        ];
    }
    
    /**
     * Gets query for [[Section]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getSection()
    {
        return $this->hasOne(Section::className(), ['id' => 'section_id']);
    }

    /**
     * Gets query for [[Contest]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContest()
    {
        return $this->hasOne(Contest::className(), ['id' => 'contest_id']);
    }

    /**
     * Gets query for [[Image]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getImage()
    {
        return $this->hasOne(Image::className(), ['id' => 'image_id']);
    }

    /**
     * Gets query for [[Metric]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getMetric()
    {
        return $this->hasOne(Metric::className(), ['id' => 'metric_id']);
    }

    public function fields() {
        $fields = parent::fields();

        
        // expand por default
        // unset(  $fields['image_id'],
        //         $fields['metric_id']
        //      );
        $fields[] = 'image'; 
        $fields[] = 'metric'; 
        $fields[] = 'section';

        return $fields;
    }

    public function afterSave($insert, $changedAttributes) {
        $params = Yii::$app->getRequest()->getBodyParams();
        $date   = new \DateTime();
        $date   = $date->format("Y");

        //Actualizamos el codigo de la imagen cargada
        $image   = Image::find()->where(['id' => $params['image_id']])->one();
        $seccion = Section::find()->where(['id' => $params['section_id']])->one();

        //buscamos la categorìa a la cual se inscribió el concursante
        $headers = Yii::$app->request->headers;
        $auth    = $headers->get('Authorization');
        $token   = explode('Bearer ', $auth)[1];

        $user = User::find()->where(['access_token' => $token])->one();
        $profile_contest = ProfileContest::find()->where(['profile_id' => $user->profile_id])->one();
        $category = Category::find()->where(['id' => $profile_contest->category_id])->one();
        $image->category = $category->name;

        $image->code = $date.'_'.$params['contest_id'].'_'.$seccion->name.'_'.$image->id;
        $image->save(false);
        return parent::afterSave($insert, $changedAttributes);
    }


    public function extraFields() {
        return [ 'contest' ];
        // return [ 'image', 'metric', 'contest' ];
    }
}
