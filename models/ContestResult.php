<?php

namespace app\models;

use Yii;

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


    public function extraFields() {
        return [ 'contest' ];
        // return [ 'image', 'metric', 'contest' ];
    }
}
