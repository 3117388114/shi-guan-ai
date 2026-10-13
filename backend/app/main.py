from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from typing import List, Optional, Union
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title='Esophageal Screening MVP', default_response_class=JSONResponse)
cors_origins = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'https://shi-guan-ai.vercel.app,http://47.114.125.73,http://localhost:5173,http://127.0.0.1:5173,http://172.20.10.2:5173').split(',') if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_methods=['*'], allow_headers=['*'])


class Assessment(BaseModel):
    # The original five fields remain optional for backward-compatible clients.
    age: Optional[Union[str, int, float]] = None
    smoking: Optional[Union[str, bool]] = None
    alcohol: Optional[Union[str, bool]] = None
    family: Optional[Union[str, bool]] = None
    symptoms: Optional[Union[str, List[str]]] = None
    gender: Optional[str] = None
    region: Optional[str] = None
    regional_research: Optional[str] = None
    smoking_years: Optional[str] = None
    alcohol_years: Optional[str] = None
    alcohol_frequency: Optional[str] = None
    hot_food: Optional[str] = None
    hot_drink: Optional[str] = None
    pickled_food: Optional[str] = None
    fresh_food: Optional[str] = None
    gerd: Optional[str] = None
    barrett: Optional[str] = None
    esophageal_disease: Optional[str] = None
    bmi: Optional[str] = None
    danger_signs: Optional[Union[str, List[str]]] = None

    @field_validator('age', mode='before')
    @classmethod
    def normalize_age(cls, value):
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return '60岁及以上' if value >= 60 else ('40–59岁' if value >= 40 else '40岁以下')
        return str(value).strip() if value is not None else value

    @field_validator('smoking', mode='before')
    @classmethod
    def normalize_smoking(cls, value):
        if value is True or (isinstance(value, str) and value.strip().lower() in {'yes', 'true', '目前吸烟'}):
            return '目前吸烟'
        if value is False or (isinstance(value, str) and value.strip().lower() in {'no', 'false', '从不吸烟'}):
            return '从不吸烟'
        return str(value).strip() if value is not None else value

    @field_validator('alcohol', mode='before')
    @classmethod
    def normalize_alcohol(cls, value):
        if value is True or (isinstance(value, str) and value.strip().lower() in {'yes', 'true', '经常饮酒'}):
            return '经常饮酒'
        if value is False or (isinstance(value, str) and value.strip().lower() in {'no', 'false', '不饮酒'}):
            return '不饮酒'
        return str(value).strip() if value is not None else value

    @field_validator('family', mode='before')
    @classmethod
    def normalize_family(cls, value):
        if value is True or (isinstance(value, str) and value.strip().lower() in {'yes', 'true', '有'}):
            return '有'
        if value is False or (isinstance(value, str) and value.strip().lower() in {'no', 'false', '没有'}):
            return '没有'
        return str(value).strip() if value is not None else value

    @field_validator('symptoms', mode='before')
    @classmethod
    def normalize_symptoms(cls, value):
        if isinstance(value, list):
            return '没有' if not value else ('有多项或持续加重' if len(value) > 1 else '有其中一项')
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {'yes', 'true'}:
                return '有其中一项'
            if normalized in {'no', 'false'}:
                return '没有'
            return value.strip()
        return value

    @field_validator('danger_signs', mode='before')
    @classmethod
    def normalize_danger_signs(cls, value):
        if isinstance(value, list):
            return value
        return str(value).strip() if value is not None else value


@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'esophageal-screening'}


@app.get('/api/questionnaire')
def questionnaire():
    return {'version': '0.1-demo', 'disclaimer': '研究/演示原型，不用于临床诊断'}


@app.post('/api/assessment')
def assessment(data: Assessment):
    # This is an explainable prototype stratification score, not a validated
    # prediction model and not a probability of cancer.
    contributions = []
    domain_scores = {
        '基础人群': 0,
        '地域': 0,
        '生活方式': 0,
        '饮食': 0,
        '家族史': 0,
        '疾病史': 0,
        '体重': 0,
    }
    modifiable_factors = []

    def add(points, label, modifiable=False, domain='生活方式'):
        if points:
            contributions.append((points, label))
            domain_scores[domain] += points
        if modifiable:
            modifiable_factors.append(label)

    age = str(data.age or '')
    if age == '60岁及以上':
        add(14, '年龄因素', domain='基础人群')
    elif age in {'40–59岁', '40-59岁'}:
        add(8, '年龄因素', domain='基础人群')

    if data.gender == '男':
        add(3, '性别修正因素', domain='基础人群')

    if data.region == '是':
        add(7, '流行病学相关地区因素', domain='地域')
    elif data.region == '不确定':
        add(3, '地区信息不确定，建议结合当地政策了解', domain='地域')

    if data.regional_research and data.regional_research != '无':
        # Kept as contextual information; this is deliberately not a fixed
        # disease-risk weight for any named locality.
        contributions.append((0, '地区研究因素（需结合研究证据）'))

    smoking = str(data.smoking or '')
    if smoking == '目前吸烟':
        add(8, '当前吸烟', True, '生活方式')
    elif smoking in {'曾经吸烟但已戒烟', '曾经吸烟，已戒'}:
        add(3, '既往吸烟史', True, '生活方式')
    if data.smoking_years == '>20年':
        add(4, '吸烟年限较长', True, '生活方式')
    elif data.smoking_years == '10-20年':
        add(2, '吸烟暴露年限', True, '生活方式')

    alcohol = str(data.alcohol or '')
    if alcohol == '经常饮酒':
        add(6, '经常饮酒', True, '生活方式')
    elif alcohol == '偶尔饮酒':
        add(2, '饮酒因素', True, '生活方式')
    if data.alcohol_years == '>20年':
        add(3, '饮酒年限较长', True, '生活方式')
    elif data.alcohol_years == '10-20年':
        add(2, '饮酒暴露年限', True, '生活方式')
    if data.alcohol_frequency == '每周3次及以上':
        add(3, '饮酒频率较高', True, '生活方式')
    elif data.alcohol_frequency == '每周1-2次':
        add(1, '饮酒频率', True, '生活方式')

    if data.hot_food == '经常':
        add(6, '长期高温饮食', True, '饮食')
    elif data.hot_food == '偶尔':
        add(2, '高温饮食暴露', True, '饮食')
    if data.hot_drink == '经常':
        add(5, '长期高温饮品暴露', True, '饮食')
    elif data.hot_drink == '偶尔':
        add(2, '高温饮品暴露', True, '饮食')
    if data.pickled_food == '多':
        add(4, '腌制食品摄入较多', True, '饮食')
    elif data.pickled_food == '一般':
        add(1, '腌制食品摄入', True, '饮食')
    if data.fresh_food == '较少':
        add(3, '新鲜蔬菜水果摄入较少', True, '饮食')
    elif data.fresh_food == '一般':
        add(1, '新鲜蔬菜水果摄入一般', True, '饮食')

    family = str(data.family or '')
    if family in {'有', '是'}:
        add(12, '一级亲属相关肿瘤史', domain='家族史')
    elif family == '不清楚':
        add(2, '家族史不清楚', domain='家族史')

    if data.gerd == '有':
        add(4, '长期胃食管反流相关因素', domain='疾病史')
    if data.barrett == '有':
        add(8, 'Barrett食管病史', domain='疾病史')
    if data.esophageal_disease == '有':
        add(7, '食管相关疾病史', domain='疾病史')
    if data.bmi in {'<18.5', '≥28'}:
        contributions.append((1, 'BMI需结合整体情况关注'))
        domain_scores['体重'] += 1

    caps = {'基础人群': 15, '地域': 8, '生活方式': 16, '饮食': 14, '家族史': 12, '疾病史': 14, '体重': 2}
    weights = {'基础人群': 1.0, '地域': 0.9, '生活方式': 0.85, '饮食': 0.8, '家族史': 1.0, '疾病史': 1.0, '体重': 0.5}
    capped_domain_scores = {
        name: min(domain_scores[name], caps[name])
        for name in domain_scores
    }
    score = round(sum(capped_domain_scores[name] * weights[name] for name in capped_domain_scores))
    level = '低风险' if score < 15 else ('一般风险' if score < 30 else '较高风险')
    factors = [label for points, label in sorted(contributions, reverse=True) if points > 0][:8]

    warning_values = data.danger_signs if data.danger_signs is not None else data.symptoms
    if isinstance(warning_values, list):
        warning_signs = [item for item in warning_values if item and item != '无']
    else:
        warning_signs = [] if not warning_values or str(warning_values) in {'无', '没有'} else [str(warning_values)]
    if warning_signs == ['有其中一项']:
        warning_signs = ['存在需要进一步关注的相关症状']
    elif warning_signs == ['有多项或持续加重']:
        warning_signs = ['存在持续或进行性加重的相关症状']

    domain_scores_response = {
        '基础人群': capped_domain_scores['基础人群'],
        '地域因素': capped_domain_scores['地域'],
        '生活方式': capped_domain_scores['生活方式'],
        '饮食因素': capped_domain_scores['饮食'],
        '家族史': capped_domain_scores['家族史'],
        '疾病史': capped_domain_scores['疾病史'],
        'BMI': capped_domain_scores['体重'],
    }
    major_factors = [
        label for points, label in sorted(contributions, key=lambda item: item[0], reverse=True)
        if points > 0
    ][:5]

    recommendations = ['保持均衡饮食，避免长期摄入过烫食物和高温饮品，维持健康生活方式。']
    if modifiable_factors:
        recommendations.append('可改善因素包括：' + '、'.join(dict.fromkeys(modifiable_factors)) + '。')
    if warning_signs:
        recommendations.append('发现危险信号：' + '、'.join(warning_signs) + '；请尽快咨询专业医疗人员。')
    else:
        recommendations.append('可结合年龄、危险因素、既往史及当地筛查政策，向专业医疗人员了解适宜的筛查建议。')

    return JSONResponse(content={
        'risk_level': level,
        'risk_score': score,
        'factors': factors,
        'domain_scores': domain_scores_response,
        'major_factors': major_factors,
        'modifiable_factors': list(dict.fromkeys(modifiable_factors)),
        'danger_signs': warning_signs,
        'warning_signs': warning_signs,
        'recommendations': recommendations,
        'disclaimer': '本平台用于健康风险提示和科普教育，不用于疾病诊断。当前分数为项目原型分层提示分数，不代表患病概率。',
    })
