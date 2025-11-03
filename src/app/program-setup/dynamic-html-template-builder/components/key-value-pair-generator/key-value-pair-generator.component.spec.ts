import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { KeyValuePairGeneratorComponent } from './key-value-pair-generator.component';

describe('KeyValuePairGeneratorComponent', () => {
  let component: KeyValuePairGeneratorComponent;
  let fixture: ComponentFixture<KeyValuePairGeneratorComponent>;
  CommonTestingModule.setUpTestBed(KeyValuePairGeneratorComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KeyValuePairGeneratorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KeyValuePairGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
