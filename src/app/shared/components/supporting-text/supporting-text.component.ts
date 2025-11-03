import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';

@Component({
  selector: 'app-supporting-text',
  templateUrl: './supporting-text.component.html',
  styleUrls: ['./supporting-text.component.scss'],
})
export class SupportingTextComponent implements OnInit {
  constructor(private _alert: AlertService) {}

  public id = '';

  public icon = 'info';
  public icon_color = '#0044C5';

  public label = 'Information';
  public support_text = '';
  public close_icon: boolean = false;

  public button_text = '';
  public link = '';

  public showReadLink: boolean = false;
  public readMore: boolean = true;

  @Output() closeDialog = new EventEmitter();
  @Input() showReadButton = true;
  /**
   * Inputs shall be in the following form:
   * support_data: {
   *    id = '<slug>' // important for Read More / Read Less content
   *    icon = '<icon_name>';
   *    icon_color = '<icon_color>';
   *    label = '<label>';
   *    support_text = '<support_text>';
   *    button_text = '<button_text>';
   *    link = '<link>';
   * }
   */

  @Input() set support_data(data: any) {
    if (data) {
      this.id = data.id;

      this.icon = data.icon ?? this.icon;
      this.icon_color = data.icon_color ?? this.icon_color;

      this.label = data.label ?? this.label;
      this.support_text = data.support_text ?? this.support_text;
      this.close_icon = data.close_icon;
      this.button_text = data.button_text ?? this.button_text;
      this.link = data.link ?? this.link;
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const docElem = document?.getElementById(this.id);
    this.showReadLink = docElem?.clientHeight > 48;
    if (this.showReadLink)
      docElem?.classList?.toggle('short-view');
  }

  onclick(link: string): void {
    if (link) window.open(link, '_blank');
    else this._alert.error('Link not available!');
  }

  toggle(): void {
    this.readMore = !this.readMore;
    document?.getElementById(this.id)?.classList?.toggle('short-view');
  }

  close() {
    this.closeDialog.emit(true);
  }
}
