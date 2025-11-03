export class BasePropertType {
    styles = [];
    componentRef?: any;
}

export class ImageProperties extends BasePropertType {
    type = "Image";
    src = '';
    attributes = [{key:'alt',value:'Image'}];
    base64Data;
    tagName = 'img';
    customProperties = {
        altText:'alt text',
        imageLink:'/sampleImageLink'
    }
}

export class HeaderProperties extends BasePropertType {
    type = "Header";
    text = '';
    attributes = [{key:"",value:""}];
    customProperties = {
        text : 'sample header'
    }
    tagName = 'h1';
}

export class SubHeaderProperties extends BasePropertType {
    type = "Sub Header";
    text = '';
    attributes = [{key:'',value:''}];
    customProperties = {
        text : 'sample sub header'
    }
    tagName = 'h2';

}

export class TextProperties extends BasePropertType {
    type = "Text";
    text = 'sample Text';
    attributes = [{key:'',value:''}];
    customProperties = {
       fontFamily:'',
       color:''
    }
    tagName = 'div';
}

export class ButtonProperties extends BasePropertType {
    type = "Button";
    text = '';
    attributes = [{key:'',value:''}];
    customProperties = {
        label : 'sample button',
        color : '',
        backgroundColor : '',
    }
    tagName = 'button';
}

export class LinkProperties extends BasePropertType {
    type = "Link";
    text = '';
    attributes = [{key:'',value:''}];
    customProperties = {
        label : 'sample Link',
        link: ''
    }
    tagName = 'a';
}

export class CustomHtmlProperties extends BasePropertType {
  type = "Custom Html";
  attributes = [{key:'',value:''}];
  tagName: 'div';
  customProperties = {
    innerHtml: ''
}
}
