<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "metric".
 *
 * @property int $id
 * @property string $prize
 * @property int|null $score
 *
 * @property ContestResult[] $contestResults
 */
class Metric extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'metric';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['prize'], 'required'],
            [['score'], 'integer'],
            [['prize'], 'string', 'max' => 10],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'prize' => 'Prize',
            'score' => 'Score',
        ];
    }

    /**
     * Gets query for [[ContestResults]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestResults()
    {
        return $this->hasMany(ContestResult::className(), ['metric_id' => 'id']);
    }
}
