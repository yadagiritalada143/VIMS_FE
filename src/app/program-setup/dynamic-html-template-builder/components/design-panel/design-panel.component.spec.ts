import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { DesignPanelComponent } from './design-panel.component';

describe('DesignPanelComponent', () => {
  let component: DesignPanelComponent;
  let fixture: ComponentFixture<DesignPanelComponent>;
  CommonTestingModule.setUpTestBed(DesignPanelComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DesignPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesignPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
