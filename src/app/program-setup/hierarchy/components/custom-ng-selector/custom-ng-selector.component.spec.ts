import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CustomNgSelectorComponent } from './custom-ng-selector.component';

describe('CustomNgSelectorComponent', () => {
  let component: CustomNgSelectorComponent;
  let fixture: ComponentFixture<CustomNgSelectorComponent>;
  CommonTestingModule.setUpTestBed(CustomNgSelectorComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomNgSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomNgSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
